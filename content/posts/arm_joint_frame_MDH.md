+++
title = "[机械臂] 关节空间和变换的定义与获取（基于改进D-H）"
date = 2026-02-18T00:00:00+08:00
draft = false
description = "基于改进 DH（MDH）梳理关节坐标系建立、参数定义、旋转矩阵与齐次变换矩阵的获取方法。"
columns = ["控制/机器人学/运动学"]
tags = ["运动学", "线性代数"]
+++

## 写在前面
本文参考Craig 的《Introduction to Robotics（机器人学导论）》

Craig 的 MDH 方法特别适合处理树状结构（分叉）的机器人，因为它的**坐标系  是固连在连杆  上的**，且原点通常位于连杆  的**前端**（即关节  的位置），而标准 DH 的坐标系  固连在连杆  上但原点在连杆的**后端**（关节 $i+1$）。

以下是按照 MDH 方法 定义关节空间（建立坐标系）的详细步骤：

### 建立坐标系 (Frame Assignment)
假设我们有连杆 $i-1$ 和连杆 $i$，以及连接它们的关节 $i$
#### **Step 1: 确定 Z 轴($Z_i$)**

* **定义**： $Z_i$ 轴的方向沿着关节 $i$ 的旋转轴（或移动轴）
* 注意区别：在标准 DH 中，$Z_i$ 通常是关节 $i+1$ 的轴；而在 Craig MDH 中，$Z_i$ 就是当前关节 $i$ 的轴

#### **Step 2: 确定 X 轴 ($X_{i-1}$)**

这是 MDH 的核心。我们需要定义前一个坐标系的 X 轴。

* **定义**：$X_{i-1}$ 轴沿着 $Z_{i-1}$ 和 $Z_i$ 两个轴之间的公垂线（Common Normal）
* **方向**：从 $Z_{i-1}$ 指向 $Z_i$
* **特殊情况**：
* 如果 $Z_{i-1}$ 和 $Z_i$ 平行：公垂线有无数条，通常选择通过前一连杆坐标原点的那个，或者使得 $d_i=0$ 的那个
* 如果 $Z_{i-1}$ 和 $Z_i$ 相交：$X_{i-1}$ 垂直于由这两个轴构成的平面（即叉乘方向 $Z_{i-1} \times Z_i$）


#### **Step 3: 确定原点 ($O_i$)**

* **定义**：坐标系 $\{i\}$ 的原点 $O_i$ 位于 $X_i$ 轴与 $Z_i$ 轴的交点
* 这意味着坐标系 $\{i\}$ 是建立在关节 $i$ 上的

#### **Step 4: 确定 Y 轴 ()**

* 根据右手定则：$Y_i = Z_i \times X_i$

---

### 定义四个 DH 参数

在 Craig 的 MDH 中，变换是从坐标系 $\{i-1\}$ 到 $\{i\}$。参数的下角标非常重要，请注意 $a$ 和 $\alpha$ 的下标是 $i-1$

1. **连杆长度 $a_{i-1}$ (Link Length)：**
		沿 $X_{i-1}$ 轴测量的，$Z_{i-1}$ 到 $Z_i$ 的距离
2. **连杆扭角 $\alpha_{i-1}$ (Link Twist)：**
	绕 $X_{i-1}$ 轴旋转的角度，使得 $Z_{i-1}$ 转到与 $Z_i$ 平行
3. **连杆偏距 $d_i$ (Link Offset)：**
	沿 $Z_i$ 轴测量的，$X_{i-1}$ 与 $X_i$ 之间的距离
4. **关节角 $\theta_i$ (Joint Angle)：**
	绕 $Z_i$ 轴旋转的角度，使得 $X_{i-1}$ 转到与 $X_i$ 平行

#### 不得不说的是

用**DH参数**和用**旋转矩阵+位移向量**描述任意两个关节的关系，本质上是等价的，

通常来说，DH 参数是一种“结构化、少参数”的描述（严格说是对相邻刚体变换的特定参数化），真正算位姿时通常都会把它变成4×4 齐次变换矩阵再连乘

---

### 旋转矩阵（A系到B系）获取

数值定义：${}^A_B R$ 的每一列就是坐标系 B 的三个主轴单位向量（$\hat{x}_B, \hat{y}_B, \hat{z}_B$）在坐标系 A 中的投影（分量）

（点积推导）通过将 B 系的基向量投影到 A 系的基向量（$\hat{x}_A, \hat{y}_A, \hat{z}_A$）上得到：
$$
{}^A_B R = \begin{bmatrix}
\hat{x}_B \cdot \hat{x}_A & \hat{y}_B \cdot \hat{x}_A & \hat{z}_B \cdot \hat{x}_A \\
\hat{x}_B \cdot \hat{y}_A & \hat{y}_B \cdot \hat{y}_A & \hat{z}_B \cdot \hat{y}_A \\
\hat{x}_B \cdot \hat{z}_A & \hat{y}_B \cdot \hat{z}_A & \hat{z}_B \cdot \hat{z}_A
\end{bmatrix}
$$


假设坐标系 B 的三个轴单位向量在坐标系 A 中表示为：
* ${}^A\hat{x}_B$：B 系 x 轴在 A 系中的描述
* ${}^A\hat{y}_B$：B 系 y 轴在 A 系中的描述
* ${}^A\hat{z}_B$：B 系 z 轴在 A 系中的描述

那么，从结果上来看，${}^A_B R$ 就是直接由这三列向量拼成的：
$$
{}^A_B R = \begin{bmatrix}
| & | & | \\
{}^A\hat{x}_B & {}^A\hat{y}_B & {}^A\hat{z}_B \\
| & | & |
\end{bmatrix}
$$

然后如果两个关节不香菱，那么我们会使用逐级传递的方式，得到两个目标关节之间的关系

---
### 位移向量（A系表示）的获取
本质上就是 从当前坐标系A原点，到目标关节坐标系原点的向量，在系A中的表达

---
### 最后拼接旋转矩阵与位移向量得到变换矩阵

MDH 的变换顺序是：先绕 X 轴动，再绕 Z 轴动

即：$Frame \{i-1\} \xrightarrow{Rot_x(\alpha), Trans_x(a)} \text{Intermediate} \xrightarrow{Rot_z(\theta), Trans_z(d)} Frame \{i\}$

公式为：
$$
{}^{i-1}_i T = Rot_x(\alpha_{i-1}) \cdot Trans_x(a_{i-1}) \cdot Rot_z(\theta_i) \cdot Trans_z(d_i)
$$

展开后的矩阵形式（实际用于计算的矩阵）：
$${}^{i-1}_i T = \begin{bmatrix}
\cos\theta_i & -\sin\theta_i & 0 & a_{i-1} \\
\sin\theta_i \cos\alpha_{i-1} & \cos\theta_i \cos\alpha_{i-1} & -\sin\alpha_{i-1} & -d_i \sin\alpha_{i-1} \\
\sin\theta_i \sin\alpha_{i-1} & \cos\theta_i \sin\alpha_{i-1} & \cos\alpha_{i-1} & d_i \cos\alpha_{i-1} \\
0 & 0 & 0 & 1
\end{bmatrix}$$

其中的旋转矩阵部分${}^{i-1}_i R$（左上角 $3\times3$）就是用来做速度和静力变换的核心
