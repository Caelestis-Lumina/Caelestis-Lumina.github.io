+++
title = "[机器人] 动力学参数辨识"
date = 2026-08-30T12:00:00+08:00
draft = true
article_status = "permanent"
applicable_versions = ["all"]
comments = true
columns = ["机器人学", "机器人学/动力学", "机器人学/动力学/参数辨识"]
tags = []
+++

## 写在前面

动力学参数辨识要解决的问题是：在机械臂几何结构已知的前提下，利用真实运动数据估计质量、质心、惯量和摩擦等未知参数。本文从单杆模型出发，逐步整理完整参数集、最小参数集、激励轨迹、数据处理和结果验证之间的关系。

## 我们到底要辨识什么？

对于一个六轴串联机械臂，我们通常从刚体动力学方程出发：

$$
\tau = M(q)\ddot q + C(q,\dot q)\dot q + G(q) + \tau_f
$$

其中：

- $q$：关节角度；
- $\dot q$：关节角速度；
- $\ddot q$：关节角加速度；
- $\tau$：关节驱动力矩；
- $M(q)$：惯性矩阵；
- $C(q,\dot q)\dot q$：科氏力和离心力相关项；
- $G(q)$：重力项；
- $\tau_f$：摩擦力矩。

动力学参数辨识的目标不是重新学习机械臂的运动学结构，而是在机械臂几何结构、关节轴等已知的情况下，通过真实运动数据估计模型中的质量、质心、惯性以及摩擦等未知动力学参数。

---
## 从单杆开始理解

先考虑最简单的一根刚性杆绕固定轴旋转。

忽略摩擦时，一个简化模型可以写成：

$$
\tau = I\ddot q + ml_c g\cos q
$$

其中：

- $I$：绕旋转轴的转动惯量；
- $m$：杆质量；
- $l_c$：旋转轴到质心的距离；
- $g$：重力加速度。

这里要注意，重力力矩并不是简单的
$mgl$，而与杆和重力方向之间的夹角有关。若我们对角度的定义不同，具体表达式可能表现为
$\sin q$ 或 $\cos q$。

现在假设我们可以测得：

$$
q,\quad \dot q,\quad \ddot q,\quad \tau
$$

那么对于一个采样点：

$$
\tau_k = I\ddot q_k + ml_cg\cos q_k
$$

如果采集很多个采样点：

$$
\tau_1 = I\ddot q_1 + ml_cg\cos q_1
$$

$$
\tau_2 = I\ddot q_2 + ml_cg\cos q_2
$$

$$
\vdots
$$

我们就得到了一个超定方程组，可以利用最小二乘估计未知参数。

---
## 为什么有些参数不需要分别求？

观察：

$$
\tau = I\ddot q + ml_cg\cos q
$$

我们会发现 $m$ 和 $l_c$ 始终以：

$$
ml_c
$$

这个组合出现。

如果仅仅依赖当前动力学实验，那么我们真正能观察到的是：

$$
ml_c
$$

而不一定能够分别得到 $m$ 和 $l_c$。

因此定义：

$$
\theta_1=I
$$

$$
\theta_2=ml_c
$$

动力学变成：

$$\tau=\ddot q\,\theta_1+g\cos q\,\theta_2$$

进一步写成矩阵形式：

$$\tau=
\begin{bmatrix}
\ddot q & g\cos q
\end{bmatrix}
\begin{bmatrix}
\theta_1\\
\theta_2
\end{bmatrix}
$$

也就是：

$$
\boxed{\tau=Y\theta}
$$

这就是后续整个动力学参数辨识的核心形式。

---
## $Y$ 和 $\theta$ 到底是什么？

我们可以把：

$$
Y(q,\dot q,\ddot q)
$$

理解为动力学方程中，各个待辨识参数前面的**已知系数**。

而：

$\theta$ 则包含需要通过实验求出的未知动力学参数或参数组合。

例如：

$$\tau=
\underbrace{
\begin{bmatrix}
\ddot q & g\cos q
\end{bmatrix}
}_{Y}
\underbrace{
\begin{bmatrix}
I\\
ml_c
\end{bmatrix}
}_{\theta}
$$

在一次实验中，我们测得 $q,\dot q,\ddot q$ 后，$Y$ 就可以计算。

真正未知的是 $\theta$。

因此需要特别区分：

> $\tau$ 是真实机器人测量得到的，而 $Y$ 不是从真实力矩中测出来的。$Y$
> 是根据真实运动状态和已知机器人结构，通过动力学模型计算得到的。

---
## 为什么真实动力学中明明有速度项？

完整机械臂动力学包含：

$$
M(q)\ddot q
$$

以及：

$$
C(q,\dot q)\dot q
$$

因此真实动力学当然存在速度相关效应。

例如科氏力、离心力中可能出现：

$$
\dot q_i\dot q_j
$$

或者：

$$
\dot q_i^2
$$

前面的单杆模型没有速度项，只是为了帮助我们理解参数辨识的基本结构而使用的简化模型，并不代表真实机械臂动力学不需要速度。

真实辨识中，每个采样点通常都应该包含：

$$
q_k,\quad\dot q_k,\quad\ddot q_k,\quad\tau_k
$$

机器人也不需要在每个采样点保持静止。恰恰相反，我们通常需要让机器人充分运动，才能激励惯性、速度耦合和重力等不同动力学效应。

---
## 为什么刚体动力学可以写成对参数线性的形式？

这里必须区分两个不同的"线性"。

机器人动力学对于运动状态：

$$
q,\quad\dot q,\quad\ddot q
$$

可以是高度非线性的，例如出现：

$$
\sin q,\quad \cos q,\quad \dot q_i\dot q_j,\quad \dot q_i^2
$$

但是在一个采样时刻，$q,\dot q,\ddot q$ 都已经测得。

那么：

$$
\sin q,\quad \cos q,\quad \dot q_i\dot q_j,\quad\ddot q_i
$$

全部变成已知数字。

例如：

$$
\tau=
\ddot q\,\theta_1
+
\sin(q)\dot q^2\,\theta_2
+
g\cos(q)\,\theta_3
$$

虽然它对 $q$ 和 $\dot q$ 是非线性的，但是对于：

$$
\theta_1,\theta_2,\theta_3
$$

仍然是线性组合。

因此我们所说的"刚体动力学对参数线性"指的是：

$$
\boxed{
\text{给定 }q,\dot q,\ddot q\text{ 后，动力学对适当选择的惯性参数是线性的}
}
$$

---
## 为什么参数必须重新组合？

如果直接选择：

$$
m,\quad c_x,\quad c_y,\quad c_z
$$

作为独立未知量，动力学中会出现：

$$
mc_x,\quad mc_y,\quad mc_z
$$

这就不是关于 $m$ 和 $c_x$ 的线性组合。

因此我们不把它们拆开，而定义一阶矩：

$$
h_x=mc_x
$$

$$
h_y=mc_y
$$

$$
h_z=mc_z
$$

这样就能够维持参数线性。

这体现了一个重要原则：

> 我们需要选择合适的参数组合，使未知参数始终以一次线性组合的方式进入动力学方程。随意拆分参数反而可能破坏线性结构。

---
## 一根刚体为什么有 10 个标准惯性参数？

一根三维刚体的标准惯性参数通常包括：

质量：

$$
m
$$

三个一阶矩：

$$
mc_x,\quad mc_y,\quad mc_z
$$

惯性张量：

$$
I=
\begin{bmatrix}
I_{xx} & I_{xy} & I_{xz}\\
I_{xy} & I_{yy} & I_{yz}\\
I_{xz} & I_{yz} & I_{zz}
\end{bmatrix}
$$

由于惯性张量是对称矩阵，因此只有 6 个独立元素：

$$
I_{xx},I_{yy},I_{zz},I_{xy},I_{xz},I_{yz}
$$

于是总参数数目为：

$$
1+3+6=10
$$

我们可以定义：

$$
\theta_i=
\begin{bmatrix}
m &
mc_x &
mc_y &
mc_z &
I_{xx} &
I_{yy} &
I_{zz} &
I_{xy} &
I_{xz} &
I_{yz}
\end{bmatrix}^T
$$

因此六根连杆最初有：

$$
6\times10=60
$$

个标准惯性参数。

这里必须统一参数所依附的连杆坐标系和惯性参考点，不能混用不同参考点定义的惯性量。

---
## 从单杆到六轴机械臂

对于六轴机械臂，在第 $k$ 个采样时刻：

$$
q_k,\dot q_k,\ddot q_k\in\mathbb R^6
$$

同时得到六个关节力矩：

$$
\tau_k=
\begin{bmatrix}
\tau_{1,k}\\
\tau_{2,k}\\
\vdots\\
\tau_{6,k}
\end{bmatrix}
\in\mathbb R^6
$$

如果使用完整的 60 个惯性参数：

$$
\theta_{\text{full}}\in\mathbb R^{60}
$$

那么：

$$
\boxed{
\tau_k=Y_{\text{full},k}\theta_{\text{full}}
}
$$

维度为：

$$\underbrace{6\times1}_{\tau_k}=
\underbrace{6\times60}_{Y_{\text{full},k}}
\underbrace{60\times1}_{\theta_{\text{full}}}
$$

因此：

$$
Y_{\text{full},k}\in\mathbb R^{6\times60}
$$

我们可以记住：

> $Y$
> 的行数对应这一采样时刻产生的关节动力学方程数量，列数对应待辨识参数数量。

所以单杆一次采样可能只有一个方程，而六轴机械臂一次采样会同时产生六个方程。

---
## 如何利用动力学算法计算 $Y$？

假设我们已经有一个参数化的逆动力学算法：

$$
\tau=
\operatorname{RNEA}(q,\dot q,\ddot q,\theta)
$$

由于动力学对所选择的惯性参数 $\theta$
是线性的，因此可以用单位基向量在计算机中探测这个线性映射。

例如：

$$\theta^{\text{test}}=\begin{bmatrix}1&0&0&\cdots\end{bmatrix}^T$$

则：

$$\tau^{(1)}=Y\begin{bmatrix}1\\0\\0\\\vdots\end{bmatrix}=
Y_{:,1}
$$

所以得到 $Y$ 的第一列。

再令：

$$
\theta^{\text{test}}=
\begin{bmatrix}
0&1&0&\cdots
\end{bmatrix}^T
$$

得到：

$$
\tau^{(2)}=Y_{:,2}
$$

依次进行，就可以构造整个 $Y$。

这里的 $\theta^{\text{test}}$
**不是机器人的真实参数**，只是计算机中用于获取线性映射各列的数学探针。

真实机器人始终拥有未知的：

$$
\theta_{\text{real}}
$$

最终我们仍然求：

$$
\tau_{\text{real}}=
Y(q_{\text{real}},\dot q_{\text{real}},\ddot q_{\text{real}})
\theta_{\text{real}}
$$

---
## 为什么 60 个参数通常不能全部辨识？

虽然六根刚体有 60
个标准惯性参数，但这些参数对关节力矩的影响通常不是完全独立的。

例如：

$$
\tau=
a(q,\dot q,\ddot q)\theta_1
+
2a(q,\dot q,\ddot q)\theta_2
$$

可以整理为：

$$
\tau=
a(q,\dot q,\ddot q)
(\theta_1+2\theta_2)
$$

无论我们做多少实验，真正能观察到的始终只是：

$$
\theta_1+2\theta_2
$$

而不能唯一分离 $\theta_1$ 和 $\theta_2$。

这里无法解耦的是**动力学参数**，不是机械臂的两个运动自由度。

因此：

$$
\boxed{
\text{物理参数数量}\neq\text{可独立辨识参数数量}
}
$$

---
## 最小参数集 Base Parameters

完整模型：

$$
\tau=Y_{\text{full}}\theta_{\text{full}}
$$

如果 $Y_{\text{full}}$
的列不满秩，那么我们可以把冗余参数组合起来，得到：

$$
\boxed{
\tau=Y_b\theta_b
}
$$

其中 $\theta_b$ 称为基础参数或最小动力学参数集。

例如完整参数有 60 个，但：

$$
\operatorname{rank}(Y_{\text{full}})=40
$$

那么真正独立的参数方向只有 40 个：

$$
\theta_b\in\mathbb R^{40}
$$

最小参数集并不是为了减少计算量而近似删除参数，而是在**不损失关节动力学表达能力**的情况下消除本来就无法独立辨识的冗余参数。

---
## 如何知道最小参数集有多少维？

我们可以生成很多组不同的运动状态：

$$
(q_1,\dot q_1,\ddot q_1),\ldots,(q_N,\dot q_N,\ddot q_N)
$$

分别计算：

$$
Y_{\text{full},k}\in\mathbb R^{6\times60}
$$

然后堆成大矩阵：

$$
W=
\begin{bmatrix}
Y_{\text{full},1}\\
Y_{\text{full},2}\\
\vdots\\
Y_{\text{full},N}
\end{bmatrix}
$$

如果采样 1000 个状态：

$$
W\in\mathbb R^{6000\times60}
$$

对它做 SVD：

$$
W=U\Sigma V^T
$$

其中奇异值为：

$$
\sigma_1,\sigma_2,\ldots,\sigma_{60}
$$

如果只有前 40 个奇异值显著非零：

$$
\sigma_1,\ldots,\sigma_{40}>0
$$

而：

$$
\sigma_{41},\ldots,\sigma_{60}\approx0
$$

那么：

$$
\operatorname{rank}(W)=40
$$

这说明最小参数空间有 40 个独立方向。

---
## 奇异值到底表示什么？

对于：

$$
Y=U\Sigma V^T
$$

奇异值可以理解为：

> $Y$ 对不同参数组合方向的"可观察强度"。

例如：

$$
\sigma=
[100,80,50,0.001]
$$

说明前三个参数方向对力矩影响明显，而最后一个参数方向非常弱。

如果：

$$
\sigma_{\min}=0
$$

就存在：

$$
\Delta\theta\neq0
$$

使得：

$$
Y\Delta\theta=0
$$

也就是说，沿这个参数方向改变参数不会改变预测力矩，因此无法从实验中辨识这个方向。

---
## 条件数是什么？

条件数定义为：

$$
\boxed{
\kappa(Y)=
\frac{\sigma_{\max}(Y)}
{\sigma_{\min}(Y)}
}
$$

如果条件数很大，说明最容易观察和最难观察的参数方向差异很大，参数求解会对噪声非常敏感。

因此条件数可以用于评价：

> 当前采样数据或激励轨迹是否能够稳定地恢复动力学参数。

但条件数不是唯一指标。

例如：

$$
\sigma(W_A)=[100,90,80,70]
$$

以及：

$$
\sigma(W_B)=[1,0.9,0.8,0.7]
$$

二者条件数相同，但第一组整体信号明显更强。

因此我们不仅希望：

$$
\kappa(W)\downarrow
$$

还希望：

$$
\sigma_{\min}(W)\uparrow
$$

从工程直觉看，就是既要让不同参数方向容易区分，又要让动力学信号相对于测量噪声足够强。

---
## SVD 与带列主元 QR 分解分别做什么？

SVD 很适合回答：

> 这个矩阵到底有多少个独立参数方向？

如果：

$$
\operatorname{rank}(W)=40
$$

我们知道需要 40 个独立方向。

接下来还要回答：

> 原来的 60 列中，哪些列可以作为一组独立基？

这时可以使用带列主元的 QR 分解：

$$
WP=QR
$$

其中 $P$ 负责重新排列列。

排列后：

$$
WP=
\begin{bmatrix}
W_1&W_2
\end{bmatrix}
$$

假设：

$$
W_1\in\mathbb R^{M\times40}
$$

为独立列，而：

$$
W_2\in\mathbb R^{M\times20}
$$

可以由 $W_1$ 表示：

$$
W_2=W_1K
$$

那么：

$$
W_1\theta_1+W_2\theta_2=
W_1(\theta_1+K\theta_2)
$$

于是定义：

$$
\boxed{
\theta_b=\theta_1+K\theta_2
}
$$

这就是冗余参数被吸收到基础参数组合中的过程。

简单记忆：

- SVD：告诉我们有几个独立方向；
- Pivoted QR：帮助我们从原始列中选出一组独立列并分析其依赖关系。

---
## 为什么需要专门设计激励轨迹？

如果机械臂一直停着，或者只进行非常单调的运动，某些动力学参数对力矩的影响可能始终没有表现出来。

于是 $Y$ 的部分列可能：

- 很小；
- 高度相关；
- 甚至完全线性依赖。

因此参数辨识不是"随便让机械臂运动，然后采很多数据"。

我们希望：

> 让不同参数尽可能充分地影响测量力矩，并且不同参数的影响尽可能容易区分。

---
## Fourier 激励轨迹

常见方法是给每个关节设计多频率 Fourier 轨迹：

$$q_i(t)=
q_{i0}
+
\sum_{k=1}^{N}
\left[
a_{ik}\sin(k\omega t)
+
b_{ik}\cos(k\omega t)
\right]
$$

它的速度可以解析计算：

$$
\dot q_i(t)=\sum_{k=1}^{N}k\omega\left[a_{ik}\cos(k\omega t)-
b_{ik}\sin(k\omega t)
\right]
$$

加速度：

$$
\ddot q_i(t)=
-\sum_{k=1}^{N}
(k\omega)^2
\left[
a_{ik}\sin(k\omega t)
+
b_{ik}\cos(k\omega t)
\right]
$$

因此一旦确定 Fourier 系数，我们就同时确定了：

$$
q(t),\quad\dot q(t),\quad\ddot q(t)
$$

Fourier 轨迹本身是周期性的，所以它并不是"不重复"。它的优势是：

- 平滑；
- 可控；
- 可解析求导；
- 可以同时包含多个频率；
- 可以重复实验；
- 可以让六个关节同时运动以激励耦合动力学。

---
## Fourier 系数不是随便选的

把所有 Fourier 系数记作：

$$
x=
\{q_{i0},a_{ik},b_{ik}\}
$$

给定 $x$ 后，我们得到：

$$
q(t),\dot q(t),\ddot q(t)
$$

进而计算：

$$
Y_b(t)
$$

把整个周期的回归矩阵堆起来：

$$
W_b(x)=
\begin{bmatrix}
Y_b(t_1)\\
Y_b(t_2)\\
\vdots\\
Y_b(t_N)
\end{bmatrix}
$$

因此存在链路：

$$
\boxed{
x
\rightarrow
(q,\dot q,\ddot q)
\rightarrow
W_b
\rightarrow
\text{辨识质量}
}
$$

所以我们真正优化的是 Fourier 系数，而不是直接修改 $Y$。

一个简单目标可以是：

$$
\min_x\kappa(W_b(x))
$$

也可以进一步考虑提高最小奇异值。

---
## 激励轨迹必须满足机械约束

如果只优化辨识质量，优化器可能生成实机无法执行的轨迹。

因此必须加入：

$$
q_{\min}\le q_i(t)\le q_{\max}
$$

$$
|\dot q_i(t)|\le\dot q_{i,\max}
$$

$$
|\ddot q_i(t)|\le\ddot q_{i,\max}
$$

还应考虑：

$$
|\tau_i(t)|\le\tau_{i,\max}
$$

以及：

- 自碰撞；
- 工作空间限制；
- 电机温升；
- 减速器允许速度；
- 安全裕量。

因此激励轨迹设计本质上是一个：

$$
\boxed{
\text{带机器人物理约束的非线性优化问题}
}
$$

---
## 实机到底采什么？

执行优化好的激励轨迹后，我们希望每个采样时刻获得：

$$
\boxed{
q_k,\quad
\dot q_k,\quad
\ddot q_k,\quad
\tau_k
}
$$

非常重要的一点是：

> 构造 $Y$ 应该使用机器人的实际运动状态，而不是直接使用参考轨迹。

也就是：

$$
\tau_{\text{real}}=
Y(q_{\text{real}},\dot q_{\text{real}},\ddot q_{\text{real}})
\theta
$$

而不是假设：

$$
q_{\text{real}}=q_{\text{ref}}
$$

因为真实机器人存在跟踪误差。

---
## 为什么加速度不能简单差分？

即使驱动器直接提供速度，我们仍然需要谨慎估计加速度。

简单差分：

$$
\ddot q_k
\approx
\frac{\dot q_k-\dot q_{k-1}}{\Delta t}
$$

如果速度测量包含噪声：

$$
\dot q_{\text{meas}}=
\dot q_{\text{true}}+n
$$

那么：

$$
\ddot q_k=
\ddot q_{\text{true},k}
+
\frac{n_k-n_{k-1}}{\Delta t}
$$

当采样频率很高时，$\Delta t$ 很小，因此噪声会被显著放大。

例如 500 Hz：

$$
\Delta t=0.002\text{ s}
$$

如果连续两帧速度噪声只相差：

$$
0.01\text{ rad/s}
$$

差分就会产生：

$$
\frac{0.01}{0.002}=
5\text{ rad/s}^2
$$

的加速度误差。

这会直接污染 $Y$。

---
## 用平滑拟合获得速度和加速度

一种常见方法是使用局部多项式拟合，例如 Savitzky-Golay 思路。

取一段位置数据：

$$
q_{k-m},\ldots,q_k,\ldots,q_{k+m}
$$

局部拟合：

$$
q(t)
\approx
a_0+a_1t+a_2t^2+a_3t^3
$$

然后解析求导：

$$
\dot q(t)=
a_1+2a_2t+3a_3t^2
$$

$$
\ddot q(t)=
2a_2+6a_3t
$$

这样不是对带噪数据逐点硬差分，而是：

$$
\boxed{
\text{带噪位置}
\rightarrow
\text{局部平滑曲线}
\rightarrow
\dot q,\ddot q
}
$$

如果驱动器本身有速度反馈，我们还可以比较：

$$
\dot q_{\text{motor}}
$$

和：

$$
\dot q_{\text{estimated}}
$$

用于检查数据质量。

---
## 时间同步

对于每个采样点，我们最终需要：

$$
(q_k,\dot q_k,\ddot q_k,\tau_k)
$$

属于同一个真实时刻。

如果位置、速度和力矩之间存在明显时间偏移，即使每一路单独都很准确，也会导致：

$$
\tau_k
\neq
Y(q_k,\dot q_k,\ddot q_k)\theta
$$

从而严重影响辨识。

如果下位机在同一个状态数据包中上传整个机械臂的
$q,\dot q,\tau$，那么至少通信层面的同步会更容易保证。

不过后续仍需留意驱动器内部不同反馈量本身是否使用相同采样时刻。

---
## 构造最终辨识数据集

对于第 $k$ 帧真实数据：

$$
q_k,\dot q_k,\ddot q_k,\tau_k
$$

计算：

$$
Y_{b,k}=
Y_b(q_k,\dot q_k,\ddot q_k)
$$

于是：

$$
\tau_k=
Y_{b,k}\theta_b+e_k
$$

采集 $N$ 帧后：

$$
\begin{bmatrix}
\tau_1\\
\tau_2\\
\vdots\\
\tau_N
\end{bmatrix}=
\begin{bmatrix}
Y_{b,1}\\
Y_{b,2}\\
\vdots\\
Y_{b,N}
\end{bmatrix}
\theta_b
+
e
$$

定义：

$$
T=
\begin{bmatrix}
\tau_1\\
\tau_2\\
\vdots\\
\tau_N
\end{bmatrix}
$$

$$
W_b=
\begin{bmatrix}
Y_{b,1}\\
Y_{b,2}\\
\vdots\\
Y_{b,N}
\end{bmatrix}
$$

得到：

$$
\boxed{
T=W_b\theta_b+e
}
$$

如果我们从机器学习角度理解：

$$
W_b\leftrightarrow X
$$

$$
T\leftrightarrow y
$$

$$
\theta_b\leftrightarrow\text{模型参数}
$$

---
## 最小二乘求参数

我们希望找到：

$$
\hat\theta_b
$$

使：

$$
\|T-W_b\theta_b\|^2
$$

最小。

即：

$$
\boxed{
\hat\theta_b=
\arg\min_{\theta_b}
\|T-W_b\theta_b\|_2^2
}
$$

理论上的正规方程形式为：

$$
\hat\theta_b=
(W_b^TW_b)^{-1}W_b^TT
$$

但工程实现中通常不建议显式计算矩阵逆，而使用 QR、SVD
等数值方法求最小二乘解。

---
## 摩擦力矩为什么也要辨识？

真实电机输出不仅需要克服刚体动力学，还需要克服摩擦。

因此：

$$
\tau_{\text{motor}}=
\tau_{\text{rigid}}
+
\tau_f
$$

其中：

$$
\tau_{\text{rigid}}=Y_b\theta_b
$$

最基础的摩擦模型可以包含黏性摩擦：

$$
\tau_v=F_v\dot q
$$

以及库仑摩擦：

$$
\tau_c=
F_c\operatorname{sgn}(\dot q)
$$

所以：

$$
\tau_f=
F_v\dot q
+
F_c\operatorname{sgn}(\dot q)
$$

它仍然可以写成线性参数形式：

$$
\tau_f=
\underbrace{
\begin{bmatrix}
\dot q&
\operatorname{sgn}(\dot q)
\end{bmatrix}
}_{Y_f}
\underbrace{
\begin{bmatrix}
F_v\\
F_c
\end{bmatrix}
}_{\theta_f}
$$

因此完整模型可以增广为：

$$
\tau=
Y_b\theta_b
+
Y_f\theta_f
$$

进一步：

$$
\boxed{
\tau=
\begin{bmatrix}
Y_b&Y_f
\end{bmatrix}
\begin{bmatrix}
\theta_b\\
\theta_f
\end{bmatrix}
}
$$

所以摩擦辨识没有改变整个流程，只是增广了参数和回归矩阵。

对于六个关节，如果每个关节分别使用一个黏性摩擦参数和一个库仑摩擦参数，就额外增加：

$$
6\times2=12
$$

个摩擦参数。

---
## 电机反馈扭矩能否直接作为 $\tau$？

这必须确认驱动器协议的定义。

如果反馈的是电机转子侧电磁转矩：

$$
\tau_m=K_ti
$$

而动力学模型中的 $\tau$ 定义在关节输出侧，那么两者不能直接混用。

假设减速比为 $N$，理想情况下：

$$
\tau_{\text{joint}}=N\tau_m
$$

如果粗略考虑效率：

$$
\tau_{\text{joint}}
\approx
\eta N\tau_m
$$

但真实减速器的效率和摩擦可能与运动方向、速度和负载有关，因此不能盲目使用一个常数效率解决所有问题。

此外，电机转子也具有惯量。折算到关节侧后，其等效惯量通常具有：

$$
J_{\text{rotor}}N^2
$$

量级的影响。

因此真实系统可能包含：

$$
\boxed{
\text{连杆刚体动力学}
+
\text{电机/减速器动力学}
+
\text{摩擦动力学}
}
$$

我们必须确保测量的 $\tau$ 和模型中的 $\tau$：

- 定义在同一侧；
- 使用相同正方向；
- 使用相同单位；
- 对应相同时间。

---
## 如何验证辨识结果？

不能只检查用于辨识的数据。

我们可以准备两套轨迹：

- 辨识轨迹 A；
- 独立验证轨迹 B。

首先用 A 求：

$$
\hat\theta=
\arg\min_\theta
\|T_A-W_A\theta\|^2
$$

然后执行从未参与求解的轨迹 B，得到：

$$
W_B,\quad T_B
$$

注意这一次不重新辨识参数，而直接预测：

$$
\boxed{
\hat T_B=W_B\hat\theta
}
$$

然后比较：

$$
\hat T_B
$$

和：

$$
T_B
$$

如果在新的运动轨迹上仍然吻合良好，才说明辨识结果具有较好的泛化能力。

---
## 可以使用什么验证指标？

最直观的是把每个关节的：

$$
\tau_{\text{pred}}(t)
$$

和：

$$
\tau_{\text{measured}}(t)
$$

画在一起。

还可以计算每个关节的 RMSE：

$$
\boxed{
\operatorname{RMSE}_i=
\sqrt{
\frac{1}{N}
\sum_{k=1}^{N}
(\tau_{i,k}-\hat\tau_{i,k})^2
}
}
$$

除此之外，还应该观察残差：

$$
e_k=
\tau_k-\hat\tau_k
$$

如果残差仍然明显随着：

$$
q,\quad\dot q,\quad\ddot q
$$

呈现某种系统性规律，就说明模型中可能还有遗漏的动力学效应，而不只是随机噪声。

---
## 力矩预测准确，是否意味着每根连杆的物理参数都准确？

不一定。

假设动力学只能观察到：

$$
\theta_b=\theta_1+2\theta_2
$$

我们辨识得到：

$$
\theta_b=10
$$

那么：

$$
\theta_1=6,\quad\theta_2=2
$$

和：

$$
\theta_1=2,\quad\theta_2=4
$$

都满足：

$$
\theta_1+2\theta_2=10
$$

如果机器人动力学只能观察这个组合，那么仅通过关节运动和力矩数据就无法判断哪一组原始参数才是真实值。

因此：

$$
\boxed{
\text{动力学预测准确}
\neq
\text{所有原始物理参数被唯一恢复}
}
$$

如果我们的目标是：

- 逆动力学；
- 重力补偿；
- 力矩前馈；
- MPC 动力学模型；
- 轨迹跟踪控制；

那么最小动力学参数 $\theta_b$ 往往已经足够，因为我们真正关心的是：

$$
(q,\dot q,\ddot q)
\longrightarrow
\tau
$$

这个映射是否准确。

如果我们的目标是准确恢复每根连杆的真实：

$$
m,\quad c,\quad I
$$

则通常还需要 CAD 先验、称重、质心测量以及物理一致性约束等额外信息。

---
## 到这里，完整的基础辨识流程是什么？

现在我们可以把前面的内容串成一条完整工程链路。

### 第一步：确定动力学模型

从：

$$
\tau=
M(q)\ddot q
+
C(q,\dot q)\dot q
+
G(q)
+
\tau_f
$$

出发。

将其整理成参数线性形式：

$$
\tau=Y\theta
$$

---
### 第二步：建立完整惯性参数

六轴机械臂六根连杆，每根刚体使用 10 个标准惯性参数：

$$
\theta_{\text{full}}\in\mathbb R^{60}
$$

必要时再加入：

- 摩擦参数；
- 电机转子惯量；
- 其他能够以参数线性形式表示的效应。

---
### 第三步：分析最小参数集

生成大量运动状态并计算：

$$
Y_{\text{full}}
$$

堆成观测矩阵 $W$。

利用 SVD 分析：

$$
\operatorname{rank}(W)
$$

确定真正独立的参数方向数量。

再利用带列主元 QR 等方法得到基础参数组合：

$$
\theta_b
$$

从而建立：

$$
\tau=Y_b\theta_b
$$

---
### 第四步：设计激励轨迹

使用多频 Fourier 轨迹：

$$
q_i(t)=
q_{i0}
+
\sum_{k=1}^{N}
[
a_{ik}\sin(k\omega t)
+
b_{ik}\cos(k\omega t)
]
$$

优化 Fourier 系数，使：

- $W_b$ 条件数尽量合理；
- 最小奇异值尽量大；
- 各参数方向得到充分激励。

同时满足：

$$
q,\dot q,\ddot q,\tau
$$

以及碰撞、安全等物理约束。

---
### 第五步：实机执行并采集数据

记录实际：

$$
q,\quad\dot q,\quad\tau
$$

并估计：

$$
\ddot q
$$

所有数据必须正确同步。

构造每一帧：

$$
(q_k,\dot q_k,\ddot q_k,\tau_k)
$$

---
### 第六步：数据预处理

对位置、速度、加速度和力矩进行必要的：

- 异常值处理；
- 平滑；
- 加速度估计；
- 时间对齐检查；
- 单位和符号检查。

尤其避免直接对噪声速度做裸差分。

---
### 第七步：构造辨识矩阵

逐帧计算：

$$
Y_k=Y(q_k,\dot q_k,\ddot q_k)
$$

堆成：

$$
T=W\theta+e
$$

---
### 第八步：最小二乘辨识

求：

$$
\boxed{
\hat\theta=
\arg\min_\theta
\|T-W\theta\|_2^2
}
$$

得到最优动力学参数估计。

---
### 第九步：独立轨迹验证

使用没有参与辨识的新轨迹。

根据：

$$
\hat\tau=
Y(q,\dot q,\ddot q)\hat\theta
$$

预测力矩，并与：

$$
\tau_{\text{measured}}
$$

比较。

检查：

- 力矩曲线；
- RMSE；
- 最大误差；
- 残差是否存在系统性结构。

---
## 最终我们真正得到的是什么？

经过整个流程，我们最终得到的是一个经过真实机器人数据校准的动力学模型：

$$
\boxed{
\hat\tau=
Y(q,\dot q,\ddot q)\hat\theta
}
$$

它可以用于回答：

> 当机器人处于某个 $q,\dot q,\ddot q$
> 状态时，为实现这种运动理论上需要多大的关节力矩？

这正是后续：

- 逆动力学前馈；
- 重力补偿；
- 力矩控制；
- MPC；
- 模型预测；
- 仿真参数校准；

所需要的核心模型。

---
## 一句话总结整个思路

我们可以把动力学参数辨识理解成：

> **先利用已知的机器人运动学结构，把复杂的非线性刚体动力学整理成"已知运动状态系数
> ×
> 未知动力学参数"的线性回归问题；再设计足够丰富的激励轨迹，让这些未知参数充分影响实测力矩；最后通过大量同步的
> $q,\dot q,\ddot q,\tau$
> 数据和最小二乘求出最能解释真实机器人动力学的参数，并使用独立轨迹验证其泛化能力。**

最终的核心链路就是：

$$
\boxed{
\text{动力学建模}
\rightarrow
\text{参数线性化}
\rightarrow
\text{最小参数集}
\rightarrow
\text{激励轨迹设计}
\rightarrow
\text{实机采集}
\rightarrow
\text{数据预处理}
\rightarrow
\text{构造 }Y
\rightarrow
\text{最小二乘}
\rightarrow
\text{独立验证}
}
$$
