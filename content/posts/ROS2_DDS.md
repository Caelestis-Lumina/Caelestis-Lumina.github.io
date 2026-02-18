+++
title = "【ROS2】Cyclone DDS C语言 API详解"
date = 2026-02-18T00:00:00+08:00
draft = false
columns = ["控制/系统架构/ROS2"]
tags = ["ROS2", "机器人", "DDS"]
+++

## 概述
本文主要说明Cyclone DDS关键 API 的功能，并解释如何**组合这些 API 来创建不同类型的节点**
当然了，一个“完整”的 API 参考（包含所有函数、参数和返回值的详细信息）最好是查看 [CycloneDDS 的官方文档](https://cyclonedds.io/docs/cyclonedds/latest/index.html)或直接阅读它安装的头文件（如 `ddsc.h`），本文的目的只是为了快速入门

本文讨论的是 CycloneDDS 的 **C API**（`ddsc`），这也是我在其他相关博客中使用的 API

### 一、 CycloneDDS 关键 C API (ddsc) 说明

在 DDS 中，所有东西（Participant, Topic, Writer, Reader）都被视为一个**实体 (Entity)**，由一个 `dds_entity_t` (它在内部是一个 `int32_t` 句柄) 来表示
> 换句话说，DDS不知道什么Node的概念，所有通过DDS通信的对象都是Entity，Node是属于ROS的概念，我在博客中沿用了这一习惯

#### 1. 核心实体：域参与者 (Domain Participant)

这是应用程序在 DDS 网络中的入口点，Participant相当于“节点”在DDS中的实例
* `dds_create_participant(domain_id, qos, listener)`: 创建并加入一个 DDS 域（网络）
    * `domain_id`: 通常是 `DDS_DOMAIN_DEFAULT`。同一域 ID 的参与者可以相互通信
    * `qos`: `NULL` 表示使用默认 QoS
* `dds_delete(participant)`: 关闭并清理参与者及其拥有的所有实体

#### 2. 数据定义：主题 (Topic)

主题将一个唯一的名称（如 `"sensor/imu_raw"`）与一个数据类型（如 `&robot_ImuRaw_desc`）绑定
* `dds_create_topic(participant, descriptor, name, qos, listener)`: 在域中声明一个主题
    * `descriptor`: 由 `idlc` 生成的数据类型描述符（例如 `&robot_ImuRaw_desc`）
    * `name`: 主题的字符串名称

#### 3. 配置行为：服务质量 (QoS)

QoS 是 DDS 中最强大也是最复杂的部分。它定义了通信的“非功能性”属性。
* `dds_create_qos()`: 创建一个新的、空的 QoS 策略集
* `dds_delete_qos(qos)`: 释放 QoS 策略集
* `dds_qset_reliability(qos, kind, max_blocking_time)`: 设置可靠性
    * `DDS_RELIABILITY_BEST_EFFORT`: 尽力而为（如 UDP），速度快，但不保证送达
    * `DDS_RELIABILITY_RELIABLE`: 可靠传输（如 TCP），保证送达，会重试
* `dds_qset_history(qos, kind, depth)`: 设置历史记录
    * `DDS_HISTORY_KEEP_LAST`: 只保留最新的 N 个样本。如`depth=1`则意味着只关心最新的那条数据。
    * `DDS_HISTORY_KEEP_ALL`: 保留所有样本（受限于资源限制）
* `dds_qset_durability(qos, kind)`: 设置持久性
    * `DDS_DURABILITY_VOLATILE`: 易失性，订阅者只能接收到在它加入网络 *之后* 发布的消息。
    * `DDS_DURABILITY_TRANSIENT_LOCAL`: （发布者）会保留最新的数据，当有新的订阅者加入时，会立刻把这些“旧”数据发送给它。这对于获取“最新状态”非常有用

#### 4. 通信端点：写入器和读取器 (Writer & Reader)

* `dds_create_writer(participant, topic, qos, listener)`: 为某个主题创建一个写入器（发布者）
* `dds_create_reader(participant, topic, qos, listener)`: 为某个主题创建一个读取器（订阅者）

#### 5. 发送数据 (Writing)

* `dds_write(writer, data_ptr)`: 发布一个数据样本。`data_ptr` 必须指向一个 `idlc` 生成的与主题匹配的结构体实例。

#### 6. 接收数据 (Reading / Taking)

这是最灵活的部分，主要有两种使用方式：

**方式 A：轮询 (Polling)**
* `dds_take(reader, samples_ptr_array, infos_ptr_array, max_samples, mask)`: 从读取器的缓存中“拿走”数据。数据被拿走后，就从缓存中删除了
* `dds_read(...)`: 与 `dds_take` 类似，但数据仍保留在缓存中，可以被再次读取
* `dds_return_loan(reader, samples_ptr_array, count)`: 当我们使用 `dds_take` 或 `dds_read` 收到数据后，实际上是“借用”了 CycloneDDS 的内部内存。**我们必须调用此函数来归还内存**，否则会导致内存泄漏

**方式 B：等待 (Waiting) - 更高效的方式**
当我们不想在 `while(true)` 循环中空转并浪费 CPU 时，可以使用 `WaitSet`
* `dds_create_waitset(participant)`: 创建一个等待集合
* `dds_waitset_attach(waitset, entity, condition)`: 将一个实体（如 `dds_reader`）附加到等待集合上。通常附加 `DDS_READ_CONDITION`，表示“当这个 reader 有数据可读时”
* `dds_wait(waitset, attached_conditions_array, max_conditions, timeout)`: **阻塞**当前线程，直到附加的某个条件被触发（例如数据到达），或超时
* `dds_waitset_detach(waitset, entity)`: 解除附加

---

### 二、 如何创建“各种类型”的节点

在 DDS 中，没有严格的“节点类型”之分。一个“节点”就是一个**域参与者 (Domain Participant)**。

一个节点的“类型”或“角色”，完全取决于它**创建了哪些写入器 (Writer) 和读取器 (Reader)**。

下面是几种常见的节点（参与者）模式：

#### 1. 类型一：纯发布者 (Publisher Node)

**职责**：只发送数据，不接收
**示例**：一个只发布传感器读数的 `sensor` 进程

**如何创建**：
1.  调用 `dds_create_participant()` 创建参与者
2.  调用 `dds_create_topic()` 定义数据主题（例如 `"sensor/imu_raw"`）
3.  调用 `dds_create_writer()` 创建一个或多个写入器
4.  在主循环中，准备数据并调用 `dds_write()` 发送
#### 2. 类型二：纯订阅者 (Subscriber Node)

**职责**：只接收数据，不发送
**示例**：一个只接收日志消息并将其写入文件的 `logger` 进程

**如何创建 (轮询方式)**：
1.  调用 `dds_create_participant()`
2.  调用 `dds_create_topic()`（确保主题名称和类型与发布者完全一致）
3.  调用 `dds_create_reader()` 创建一个或多个读取器
4.  在主循环中，调用 `dds_take()` 检查是否有数据
5.  如果 `dds_take()` 返回 `n > 0`，则处理数据，然后**必须调用 `dds_return_loan()`**


**如何创建 (WaitSet 方式 - 推荐)**：
1.  （同上 1-3 步）
4.  调用 `dds_create_waitset()`
5.  调用 `dds_waitset_attach(ws, reader, DDS_READ_CONDITION)`
6.  在主循环中，调用 `dds_wait(ws, ...)`。这个调用会**阻塞**，直到数据到达
7.  `dds_wait()` 返回后，说明 `reader` 上有数据了，此时再调用 `dds_take()` 和 `dds_return_loan()`

这种方式更高效，因为它用“事件驱动”取代了“忙等待”循环

#### 3. 类型三：收发节点 (Pub/Sub Node)

**职责**：同时发送和接收数据。
比如controller节点可以配置成这个类型(订阅 IMU, 发布 PWM) 

**如何创建**：
这仅仅是**类型一和类型二的组合**。我们只需在同一个 `dds_participant` 上同时创建需要的 `dds_reader` 和 `dds_writer` 即可


#### 4. 类型四：请求/应答 (Request/Reply) 模式

这是一种更高级的模式，没有单一的 API 函数，而是通过组合实现的。

* **服务端 (Replier)**:
    1.  创建一个参与者。
    2.  创建 "Request Topic" (例如 `robot/command_request`) 的 `dds_reader`
    3.  创建 "Reply Topic" (例如 `robot/command_reply`) 的 `dds_writer`
    4.  等待 (通过 `dds_take` 或 `dds_wait`) "Request" 到达
    5.  处理请求
    6.  将结果通过 `dds_write` 发送到 "Reply Topic"

* **客户端 (Requester)**:
    1.  创建一个参与者
    2.  创建 "Request Topic" 的 `dds_writer`
    3.  创建 "Reply Topic" 的 `dds_reader`
    4.  生成一个唯一的请求 ID，并将其放入请求消息中
    5.  通过 `dds_write` 发送 "Request"
    6.  等待 (通过 `dds_take` 或 `dds_wait`) "Reply" 到达
    7.  检查收到的应答中的请求 ID 是否与我发送的相匹配，以确认这是给我的应答