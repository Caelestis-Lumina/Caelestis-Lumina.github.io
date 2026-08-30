+++
title = "[c++] 智能指针"
date = 2026-08-30T00:00:00+08:00
draft = false
article_status = "permanent"
applicable_versions = ["all"]
comments = true
description = "考虑到cpp较为复杂的内存管理机制，为了方便管理实例的生命周期，cpp引入了智能指针的机制"
tags = ["C++", "内存机制"]
+++

# C++ 智能指针：从普通指针到所有权与生命周期

## 1. 为什么我们需要智能指针

假设我们在堆上创建一个对象：

```cpp
Robot* p = new Robot;
```

可以理解为：

```text
Stack

┌──────────────┐
│ p            │
│ 0x1234 ──────┼────┐
└──────────────┘    │
                    ↓
Heap

             ┌──────────────┐
0x1234       │ Robot        │
             └──────────────┘
```

普通指针 `p` 保存的是对象地址。

我们可以正常使用：

```cpp
p->start();
p->stop();
```

问题不在于“怎么访问 `Robot`”。

真正的问题是：

> 谁负责最终销毁这个 `Robot`？

使用裸指针时，我们需要自己写：

```cpp
delete p;
```

如果忘记，就是内存泄漏。

如果重复 `delete`，又会造成严重错误。

因此，现代 C++ 更希望把“对象地址”和“对象所有权”一起表达出来。

这就是智能指针存在的意义。

---

## 2. 普通指针本质上只表示地址

例如：

```cpp
Robot* p;
```

我们最好把它理解成：

> 我知道某个 `Robot` 在哪里。

它并不会自动说明：

- 这个对象是不是我创建的；
- 我是不是它的所有者；
- 我是否应该 `delete`；
- 其他人是不是也在使用；
- 对象是否还活着。

例如：

```cpp
Robot* p1 = new Robot();
Robot* p2 = p1;
Robot* p3 = p1;
```

现在：

```text
p1 ─┐
p2 ─┼──> Robot
p3 ─┘
```

问题马上出现：

> 谁负责销毁 `Robot`？

如果：

```cpp
delete p1;
```

那么 `Robot` 已经销毁，但：

```cpp
p2
p3
```

还保存着原来的地址。

它们此时已经变成悬空指针。

如果再执行：

```cpp
delete p2;
```

又会重复释放。

普通指针本身并不会帮助我们管理这些关系。

---

## 3. 所有权到底是什么意思

所谓“所有权”，并不是说某个指针物理上独占了内存。

它表达的是一种程序设计责任：

> 谁负责保证这个对象最终会被正确销毁？

例如：

```cpp
std::unique_ptr<Robot> robot;
```

我们可以把它理解成：

```text
robot
  │
  │ owns
  ↓
Robot
```

这里表达的不只是：

```text
robot 知道 Robot 的地址
```

还表达：

```text
robot 负责 Robot 的生命周期
```

因此：

```text
unique_ptr 销毁
↓
它负责销毁 Robot
```

这就是“所有权”比“指针地址”多出来的含义。

---

## 4. 什么叫“动态管理生命周期”

我们之前说：

> 这个对象的所有权和生命周期是否需要动态管理？

这里的“动态管理”并不等于：

> 必须手动 `new/delete`。

更准确的意思是：

> 对象什么时候销毁，不再只由创建它的那个 `{}` 作用域决定，而可能根据程序运行过程和所有权关系决定。

例如：

```cpp
void foo() {
    Robot robot;
}
```

`robot` 的生命周期完全固定：

```text
进入 foo
↓
robot 构造
↓
离开 foo
↓
robot 析构
```

这是典型的作用域生命周期。

而：

```cpp
std::unique_ptr<Robot> createRobot() {
    return std::make_unique<Robot>();
}
```

调用：

```cpp
auto robot = createRobot();
```

此时：

```text
createRobot() 内创建 Robot
↓
createRobot() 返回
↓
Robot 仍然存在
↓
所有权转移给调用者
```

这个 `Robot` 的生命周期已经脱离了创建它的函数。

因此我们可以说它的生命周期需要动态管理。

但销毁仍然可以是自动的。

所以：

```text
动态生命周期 ≠ 手动 delete
```

现代 C++ 更希望做到：

> 生命周期动态决定，但资源自动释放。

---

## 5. `std::unique_ptr`

`std::unique_ptr` 表示：

> 一个对象在同一时刻只有一个所有者。

例如：

```cpp
auto p1 = std::make_unique<Robot>();
```

关系是：

```text
p1 ─────> Robot
```

这里 `p1` 是唯一所有者。

---

## 6. 为什么 `unique_ptr` 不能复制

下面的代码不允许：

```cpp
auto p1 = std::make_unique<Robot>();

auto p2 = p1;   // 编译错误
```

原因非常直接：

如果允许复制，就会变成：

```text
p1 ──┐
     ├──> Robot
p2 ──┘
```

但 `unique_ptr` 的语义就是：

```text
唯一所有者
```

两个唯一所有者是矛盾的。

所以编译器直接禁止这种操作。

---

## 7. `unique_ptr` 可以转移所有权

虽然不能复制，但可以移动：

```cpp
auto p1 = std::make_unique<Robot>();

auto p2 = std::move(p1);
```

之后：

```text
p1 ──X

p2 ─────> Robot
```

也就是说：

> `Robot` 没有被复制，只是“归谁负责”发生了变化。

我们可以把它理解成产权转移。

原来：

```text
Robot 归 p1 管
```

现在：

```text
Robot 归 p2 管
```

对象本身仍然是同一个对象。

---

## 8. `unique_ptr` 什么时候销毁对象

例如：

```cpp
{
    auto robot = std::make_unique<Robot>();

    robot->start();
}
```

离开作用域时：

```text
robot 这个 unique_ptr 析构
↓
unique_ptr 发现自己仍然拥有 Robot
↓
调用 Robot 析构
↓
释放堆内存
```

我们不需要写：

```cpp
delete robot;
```

所以 `unique_ptr` 可以理解为：

> 一个自动负责 `delete` 的唯一所有权管理器。

---

## 9. `std::shared_ptr`

`std::shared_ptr` 表示：

> 一个对象可以由多个所有者共同拥有。

例如：

```cpp
auto p1 = std::make_shared<Robot>();
auto p2 = p1;
auto p3 = p1;
```

关系是：

```text
p1 ─┐
p2 ─┼──> Robot
p3 ─┘
```

这里三个 `shared_ptr` 都是所有者。

---

## 10. `shared_ptr` 如何判断什么时候销毁

`shared_ptr` 一般会通过控制块维护共享所有权信息，其中包括引用计数。

可以粗略理解为：

```text
p1
p2 ───> control block ───> Robot
p3

strong count = 3
```

如果：

```cpp
p1.reset();
```

那么：

```text
strong count = 2
```

对象继续存在。

再：

```cpp
p2.reset();
```

变成：

```text
strong count = 1
```

对象仍然存在。

最后：

```cpp
p3.reset();
```

变成：

```text
strong count = 0
```

这时：

```text
Robot 析构
↓
对象内存释放
```

所以 `shared_ptr` 最核心的规则是：

> 最后一个共享所有者消失时，对象自动销毁。

---

## 11. “还有人要用”这个说法为什么不够准确

我们很容易说：

> 只要还有人要用这个对象，它就会一直存在。

这句话在直觉上接近，但在 C++ 中不够精确。

C++ 不知道我们的主观意图：

```text
“我以后还想用”
```

它只知道：

```text
还有没有所有权存在
```

例如：

```cpp
auto owner = std::make_unique<Robot>();

Robot* raw = owner.get();
```

现在：

```text
owner ─────> Robot
raw   ─────> Robot
```

但只有：

```text
owner
```

拥有对象。

`raw` 只是知道地址。

如果：

```cpp
owner.reset();
```

那么：

```text
Robot 被销毁
```

即使 `raw` 还保存着地址，也不能阻止对象被销毁。

此时：

```cpp
raw->start();
```

就是未定义行为，因为 `raw` 已经悬空。

因此我们应该说：

> 只要所有权仍然存在，对象就会保持有效。

而不是：

> 只要还有一个普通指针指向它，对象就会保持有效。

---

## 12. 普通指针、`unique_ptr` 和 `shared_ptr` 的直觉区别

可以这样记：

### 普通指针

```cpp
Robot* p;
```

表示：

> 我知道 `Robot` 在哪里。

### `unique_ptr`

```cpp
std::unique_ptr<Robot> p;
```

表示：

> 我知道 `Robot` 在哪里，而且这个 `Robot` 唯一归我管理。

### `shared_ptr`

```cpp
std::shared_ptr<Robot> p;
```

表示：

> 我知道 `Robot` 在哪里，而且我是它的共享所有者之一。

把它画出来：

```text
Robot*
│
└── 我只保存地址


unique_ptr<Robot>
│
└── 我保存地址，并且我是唯一所有者


shared_ptr<Robot>
│
└── 我保存地址，并且我是若干所有者之一
```

---

## 13. 智能指针和普通指针在“使用对象”时有什么区别

如果只是调用成员函数，语法几乎一样。

普通指针：

```cpp
Robot* p = new Robot();

p->start();
p->stop();
```

`unique_ptr`：

```cpp
auto p = std::make_unique<Robot>();

p->start();
p->stop();
```

`shared_ptr`：

```cpp
auto p = std::make_shared<Robot>();

p->start();
p->stop();
```

都可以：

```cpp
p->start();
```

也都可以解引用：

```cpp
(*p).start();
```

所以：

> 智能指针和普通指针最大的区别不在访问语法，而在所有权和生命周期管理。

---

## 14. `.get()` 是什么

智能指针有时需要传给只接受普通指针的接口。

例如：

```cpp
void runRobot(Robot* robot);
```

我们有：

```cpp
auto robot = std::make_unique<Robot>();
```

可以：

```cpp
runRobot(robot.get());
```

`.get()` 返回内部保存的裸指针：

```text
unique_ptr
   │
   │ .get()
   ↓
 Robot*
```

但非常重要：

> `.get()` 只是借出地址，并没有转移所有权。

所以：

```cpp
delete robot.get();   // 错误
```

这是非常危险的。

因为 `unique_ptr` 仍然认为自己拥有这个对象，将来还会再销毁一次。

---

## 15. 一个典型的所有权关系

例如：

```cpp
class ControlRuntime {
private:
    std::unique_ptr<SpiWorker> spi_worker_;
};
```

它表达的语义是：

```text
ControlRuntime
      │
      │ owns
      ↓
  SpiWorker
```

也就是说：

> `ControlRuntime` 是 `SpiWorker` 的唯一所有者。

当 `ControlRuntime` 被销毁：

```text
ControlRuntime 析构
↓
spi_worker_ 析构
↓
SpiWorker 析构
```

这就是现代 C++ 很常见的所有权树：

```text
Application
   │
   ├── unique_ptr<ControlRuntime>
   │          │
   │          ├── unique_ptr<SpiWorker>
   │          └── unique_ptr<MpcWorker>
   │
   └── unique_ptr<Logger>
```

从结构中我们就能看出谁拥有谁。

---

## 16. `unique_ptr` 和 `shared_ptr` 的核心区别

| 特性 | `unique_ptr` | `shared_ptr` |
|---|---|---|
| 所有者数量 | 1 个 | 多个 |
| 可直接复制 | 不可以 | 可以 |
| 可转移 | 可以 | 可以 |
| 销毁条件 | 唯一所有权消失 | 最后一个共享所有权消失 |
| 运行时开销 | 很低 | 更高 |
| 所有权语义 | 非常清晰 | 更灵活但更复杂 |

`shared_ptr` 通常还需要维护控制块和引用计数。

因此它比 `unique_ptr` 更重。

---

## 17. 为什么默认优先 `unique_ptr`

如果一个对象本来就只有明确的主人：

```text
ControlRuntime
      ↓
  SpiWorker
```

那么：

```cpp
std::unique_ptr<SpiWorker>
```

直接表达了真实架构。

如果改成：

```cpp
std::shared_ptr<SpiWorker>
```

就等于告诉代码读者：

> `SpiWorker` 的生命周期可能还由其他对象共同决定。

如果实际没有这种需求，那么 `shared_ptr` 只会让所有权关系变模糊。

所以现代 C++ 常见的原则是：

> 默认使用值语义或 `unique_ptr`；只有确实存在共享所有权时，才使用 `shared_ptr`。

---

## 18. 普通指针仍然有价值

智能指针并不是要消灭普通指针。

普通指针非常适合表达：

> 我只是临时访问这个对象，但不拥有它。

例如：

```cpp
void updateRobot(Robot* robot) {
    robot->update();
}
```

如果调用者拥有对象：

```cpp
auto robot = std::make_unique<Robot>();

updateRobot(robot.get());
```

那么关系是：

```text
unique_ptr
   │
   │ owns
   ↓
 Robot
   ↑
   │ borrows / observes
Robot*
```

这里普通指针扮演的是：

> 非拥有访问者。

这是一种很正常的设计。

---

## 19. 所有权和“谁还能访问”是两回事

假设：

```cpp
class RobotSystem {
public:
    std::unique_ptr<Motor> motor;
};
```

系统中还有其他模块保存：

```cpp
Motor* motor_view;
```

可能形成：

```text
RobotSystem::motor
        │
        │ owns
        ↓
      Motor
       ↑  ↑
       │  │
 Controller
 Logger
```

`Controller` 和 `Logger` 可以访问 `Motor`，但并不意味着它们拥有 `Motor`。

真正控制生命周期的是：

```text
RobotSystem::motor
```

因此：

> “有多少地方能访问对象”和“有多少所有者”是两个完全不同的问题。

这是理解智能指针非常关键的一点。

---

## 20. 我们什么时候该用哪一种

可以按这个顺序思考。

### 情况一：对象生命周期天然属于当前作用域

直接使用对象：

```cpp
Robot robot;
```

优先级通常最高。

---

### 情况二：对象需要动态生命周期，而且只有一个明确所有者

使用：

```cpp
std::unique_ptr<Robot>
```

例如：

```text
ControlRuntime 独占 SpiWorker
```

---

### 情况三：多个模块必须共同决定对象什么时候销毁

使用：

```cpp
std::shared_ptr<Robot>
```

这应该是一个明确的设计决定，而不是因为“shared_ptr 比较方便”。

---

### 情况四：只是访问，不负责生命周期

可以使用：

```cpp
Robot*
```

或者引用：

```cpp
Robot&
```

前提是我们清楚：

> 被访问对象必须在使用期间仍然存在。

---

## 21. 一个统一的思考框架

以后看到一个对象，我们可以连续问四个问题：

### 第一问：对象需要活多久？

```text
只活在当前作用域？
还是需要跨函数、跨模块存在？
```

### 第二问：谁拥有它？

```text
一个明确所有者？
还是多个共同所有者？
```

### 第三问：谁只是访问它？

```text
哪些模块只是借用地址或引用？
```

### 第四问：谁负责最终销毁？

```text
作用域？
unique_ptr？
最后一个 shared_ptr？
```

只要这四个问题能回答清楚，内存管理设计通常就已经比较清楚了。

---

## 22. 最终总结

普通指针：

```text
我知道对象在哪里。
```

`unique_ptr`：

```text
我知道对象在哪里，
而且我是它唯一的所有者。
```

`shared_ptr`：

```text
我知道对象在哪里，
而且我是多个所有者之一。
```

真正重要的区别并不是：

```cpp
p->start()
```

怎么写。

而是：

> 谁拥有对象、对象要活多久、谁负责最终销毁。

现代 C++ 智能指针真正解决的，是“所有权和生命周期”问题，而不仅仅是“自动帮我们写 `delete`”。
