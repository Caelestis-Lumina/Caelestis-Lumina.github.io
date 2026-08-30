+++
title = "[三维重建]从世界坐标系到像素坐标系（相机标定）"
date = 2026-08-31T00:00:00+08:00
draft = false
article_status = "permanent"
applicable_versions = ["all"]
comments = true
tags = ["感知", "视觉"]
+++

## 概述
这是视觉的第一步，找到相机画面和世界的关联性

本篇章也会说明，内参和外参分别如何在投影过程中发挥作用
## 原理说明
已知一个世界坐标系下的点 $(x, y, z)$，不难注意到世界坐标系下的点在相机坐标系中表达为：（用简单的相似三角形就能推得）
$$u = f \cdot k \cdot \frac{x}{z} + c_x \tag{1}$$$$v = f \cdot l \cdot \frac{y}{z} + c_y \tag{2}$$
其中：
$u, v$ 是像素坐标系下的横纵坐标；
$f$ 是相机的焦距；
$k, l$ 是像素和距离的转换系数，单位是(pixel per mm或pixel per m) ；
$c_x, c_y$ 是像素坐标系下，主点和像素坐标系零点的偏移量

我们定义：$\alpha = f \cdot k, \beta = f \cdot l$


整理得：
$$P_h'=
\begin{bmatrix} \alpha x+c_x z \\ \alpha y+c_y z \\ z \end{bmatrix}=
\begin{bmatrix}
f \cdot k & 0 & c_x & 0 \\
0 & f \cdot l & c_y & 0 \\
0 & 0 & 1 & 0
\end{bmatrix}_{3 \times 4}
\begin{bmatrix} x \\ y \\ z \\ 1 \end{bmatrix} \tag{*}$$
其中：$P_h'$为齐次坐标系下的像素坐标，根据齐次转欧式的公式（逐元素除以最后一维的值，并删除最后一维）可得：
$$
P_h'\rightarrow P'= (\alpha \cdot \frac{x}{z} + c_x, \beta \cdot \frac{y}{z} + c_y)
$$
对比来看，和最上面的公式(1)和(2)是等价的；

### 更进一步
如果我们先不展开写，并将外参也考虑进来（外参矩阵会在下面讲到），将\(\*)式中的3*4矩阵令作内参矩阵 $K$ ，则不难推得完整的投影大一统公式：
$$\begin{bmatrix} U \\ V \\ W \end{bmatrix} =
K \cdot [R | T] \cdot \begin{bmatrix} X_w \\ Y_w \\ Z_w \\ 1 \end{bmatrix}$$
计算出 $\begin{bmatrix} U \\ V \\ W \end{bmatrix}$ 后，我们再将齐次坐标降维回欧式空间：将所有分量除以最后一个分量（齐次除法）
$$u = \frac{U}{W}$$$$v = \frac{V}{W}$$
> 因为 $W$ 里存储的刚好就是深度 $Z_c$，这一步除法天然地完成了“近大远小”的透视缩放，最终得到了该点在二维屏幕上的绝对像素坐标 $(u, v)$

### 再进一步
如果我们考虑相机的像素并不是严格的矩形，而是平行四边形，则需要再引入一个矫正系数 $\theta$， 公式变化为
$$
K=\begin{bmatrix}
\alpha & -\alpha cot\theta & c_x \\
0 & \beta / sin\theta & c_y \\
0 & 0 & 1
\end{bmatrix}_{3 \times 3}
$$
我们将这个$K$定义为**相机内参矩阵**，其包含五个自由度

进而可得：(下方P‘的角标已去除，后续默认描述的坐标都在齐次坐标系中，以方便变换的进行)
$$P'=
\begin{bmatrix}
\alpha & -\alpha cot\theta & c_x & 0 \\
0 & \beta / sin\theta & c_y & 0 \\
0 & 0 & 1 & 0
\end{bmatrix}_{3 \times 4}
\begin{bmatrix} x \\ y \\ z \\ 1 \end{bmatrix} \tag{*}$$
其中3\*4的矩阵我们定义为**投影矩阵 $M$**，且有 $M=K\begin{bmatrix} I & 0 \end{bmatrix}$ 成立（其中 $I$ 为3*3的单位矩阵）

### 还进一步
由于世界坐标系和相机坐标系之间可能还有**运动变换关系**，因此世界坐标系下的点并不能直接应用投影矩阵，需要先应用一次运动变换（类似于将世界系下的点坐标变换到**相机坐标系**，再做投影解算），因此还需要引入相机外参，用于描述相机和世界之间的关系

我们定义**齐次坐标系下的外参矩阵**为$\begin{bmatrix} R & T \\ 0 & 1 \end{bmatrix}_{4 \times 4}$，因此式(\*)可改写为：
$$
P'=K\begin{bmatrix} I & 0 \end{bmatrix}P=K\begin{bmatrix} I & 0 \end{bmatrix}\begin{bmatrix} R & T \\ 0 & 1 \end{bmatrix}P_w=K\begin{bmatrix} R & T \end{bmatrix}P_w
$$
其中，
$P_w$为世界坐标系下的齐次坐标，
$P$可以认为是相机坐标系下的坐标；

$\begin{bmatrix} R & T \end{bmatrix}$ 定义为常规意义下的**外参矩阵**

投影矩阵也能定义为 $M=K\begin{bmatrix} R & T \end{bmatrix}$

而式(\*)中的$\begin{bmatrix} x \\ y \\ z \\ 1 \end{bmatrix}$, 可以认为是相机系下的坐标$P$，也可以认为此时是一种**相机系与世界系完全重合的情况**
## 补充说明
式(1)和(2)中，相机坐标系下的$x, y$，和像素坐标系下的$u, v$并不是线性关系，因为$z$会随着$x, y$的变化而变化;

笔者认为，上面的**相机系**，用机器人的**本体系**来理解，$\begin{bmatrix} R & T \end{bmatrix}$表述的是**本体与世界之间的关系**

最后，统计从世界齐次坐标变换到像素坐标系，**一共存在11个自由度（独立自变量）**，其中内参矩阵$K$有5个（$\alpha,\beta,\theta,c_x,c_y$），外参矩阵$\begin{bmatrix} R & T \end{bmatrix}$有6个自由度（虽然用12个变量进行描述，实际上自由度只有旋转平移各三个）
不难发现，由于每组参考数据可以提供两个独立方程，因此，标定相机时，我们至少需要6组独立的数据，但是保险起见，我们会取远多于6组数据，通常是20-30组数据；
又因为我们的方程数远多于自变量的数量（**超定方程组**），因此我们需要使用迭代求解，通常是**最小二乘法**（因为每个方程本身就存在噪声，所以直接求一个解析的固定值也并不合理，最小二乘反而可以在噪声中取到一个最合理的均值）
