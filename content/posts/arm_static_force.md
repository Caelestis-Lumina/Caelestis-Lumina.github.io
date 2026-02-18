+++
title = "[机械臂] 速度与静力的分析"
date = 2026-02-18T00:00:00+08:00
draft = false
columns = ["控制/机器人学/静力学"]
tags = ["静力学", "机器人", "机械臂"]
+++

## 写在前面

本文的主要目的是说明速度和静力是如何在各级机械臂关节上传递的

属于运动学和动力学之间的过渡部分，
如果只是想实现重力补偿，那到这里就够了，动力学建模的话，还有一部分要学，不过静力分析也是必要的环节
## 条件预设

* **假设：**$\{A\}$ 和 $\{B\}$ 都在同一个刚体上（或者我们想把  的量等效变换到 ）。
* **已知量：**
	* ${}^A_B R$：从 $\{B\}$ 到 $\{A\}$ 的旋转矩阵
	* ${}^A P_{BORG}$：$\{B\}$ 原点在 $\{A\}$ 中的位置矢量（简称 $P$），即 **从 A 指向 B 的向量**。

## 具体实现
### 一、 速度变换公式推导 (Velocity Transformation)

把 $\{B\}$ 系下的广义速度 $\begin{bmatrix} {}^B v_B \\ {}^B \omega_B \end{bmatrix}$ 变换为 $\{A\}$ 系下的 $\begin{bmatrix} {}^A v_A \\ {}^A \omega_A \end{bmatrix}$

#### 1. 角速度变换 (Angular Velocity)

角速度是自由矢量，它只受旋转矩阵的影响，不受位置平移的影响
$${}^A \omega_A = {}^A_B R \cdot {}^B \omega_B$$

#### 2. 线速度变换 (Linear Velocity)

这是“刚体速度公式”的应用。

* **物理直觉**： $A$ 点的速度 = $B$ 点的速度（旋转过来） + 旋转引起的切向速度。
* **矢量公式**：$v_A = v_B + \omega \times r_{B \to A}$
* **代入坐标**：
	* $r_{B \to A}$ 是从 B 指向 A 的向量，也就是 $-P$。
	* 第一项（平移贡献）：${}^A_B R \cdot {}^B v_B$
	* 第二项（旋转贡献）：$({}^A_B R \cdot {}^B \omega_B) \times (-P)$
	* 整理一下（利用叉积性质 $a \times (-b) = - (a \times b) = b \times a$）：$$  \text{旋转项} = P \times ({}^A_B R \cdot {}^B \omega_B)$$
* **最终线速度公式：**$$  {}^A v_A = {}^A_B R \cdot {}^B v_B + P \times ({}^A_B R \cdot {}^B \omega_B)$$



#### 3. 引入“叉积矩阵算子”

为了把“叉积”写进矩阵里，我们需要引入反对称矩阵算子 $S(P)$（有时记作 $\hat{P}$ 或 $P^\times$）。对于向量 $P = [x, y, z]^T$，定义：
$$S(P) = P \times = \begin{bmatrix} 0 & -z & y \\ z & 0 & -x \\ -y & x & 0 \end{bmatrix}$$
那么 $P \times \omega$ 就可以写成矩阵乘法 $S(P) \cdot \omega$。

这一步本质上是将向量叉积**写成**矩阵向量积，仅改变表达形式，不改变计算结果，目的是方便求导和计算机运算
#### 4. 速度变换矩阵

将上述两个方程合并：
$$\begin{bmatrix} {}^A v_A \\ {}^A \omega_A \end{bmatrix} = 
\begin{bmatrix} {}^A_B R & S(P) \cdot {}^A_B R \\ 0 & {}^A_B R \end{bmatrix}
\begin{bmatrix} {}^B v_B \\ {}^B \omega_B \end{bmatrix}$$
这个  的大矩阵，在旋量理论中常被称为 **Adjoint Map (伴随变换)**。

---

### 二、 力-力矩变换公式推导 (Force-Moment Transformation)

我们要把作用在 $\{B\}$ 系原点的广义力 $\begin{bmatrix} {}^B f_B \\ {}^B n_B \end{bmatrix}$ 等效变换为作用在 $\{A\}$ 系原点的 $\begin{bmatrix} {}^A f_A \\ {}^A n_A \end{bmatrix}$

#### 1. 力变换 (Force)

力是滑动矢量，变换坐标系时，只改变方向（旋转），大小不变。
$${}^A f_A = {}^A_B R \cdot {}^B f_B$$
#### 2. 力矩变换 (Moment)

这里用到静力学平衡（或者等效力系原理）。

* **物理直觉：**$A$ 点受到的扭矩 = $B$ 点原本的扭矩（旋转过来） + $B$ 点的力对 $A$ 产生的力矩
* **矢量公式：**$n_A = n_B + r_{A \to B} \times f_B$
* **代入坐标：**
	* $r_{A \to B}$ 是从 A 指向 B 的向量，这正是我们的 $P$
	* 第一项（纯力矩）：${}^A_B R \cdot {}^B n_B$
	* 第二项（力臂力矩）：$P \times ({}^A_B R \cdot {}^B f_B)$
* **最终力矩公式：**$$  {}^A n_A = {}^A_B R \cdot {}^B n_B + S(P) \cdot ({}^A_B R \cdot {}^B f_B)$$



#### 3. 力变换矩阵

将上述两个方程合并：
$$\begin{bmatrix} {}^A f_A \\ {}^A n_A \end{bmatrix} = 
\begin{bmatrix} {}^A_B R & 0 \\ S(P) \cdot {}^A_B R & {}^A_B R \end{bmatrix}
\begin{bmatrix} {}^B f_B \\ {}^B n_B \end{bmatrix}$$

---


### 对比两个矩阵

我们观察到，这两个矩阵存在极强的对称性，二者近似于转置关系（如果不考虑  的反对称性质带来的符号变化）

这正好说明：**运动学（速度）和静力学（力）是互为对偶（Dual）的**

速度变换矩阵 (Velocity) 右上角有项，说明 角速度  会 影响线速度 （因为旋转产生切向速度）。

力变换矩阵 (Force) 左下角有项，说明 力  会影响 力矩 （因为力臂产生力矩）。
