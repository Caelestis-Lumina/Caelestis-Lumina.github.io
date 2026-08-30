+++
title = "[MPC] 模型预测控制的数学推导"
date = 2026-08-29T00:00:00+08:00
draft = false
article_status = "permanent"
applicable_versions = ["all"]
comments = true
columns = ["控制", "控制/算法"]
tags = ["控制", "机器人"]
+++

## 写在前面
模型预测控制 `Model Predictive Control` 是一种基于模型、能够滚动预测、优化、执行的闭环控制算法；用白话讲，就是拿到系统状态后，计算后面用怎样的系统输出，才能让系统达到“可见范围内的最优”；常用于MIMO系统，一般来说，效果比LQR和PID都要好

## 具体公式推导
### 二次规划 Quadratic Programming
这部分其实和LQR差别不大，我们的核心目标都是最小化代价函数，只不过MPC的代价函数可以更复杂
$$
Q=\begin{bmatrix} q1 && && && \\ && q2 && && \\ && &&  ... &&\\  && && && q_n \end{bmatrix}
$$
一般来说，优化目标是找到 $Q$ 使得:
$$
min(z^T Q z + C^T z)
$$

### 基本定义

* 定义 `状态外推方程`：
$$
x(k+1)=Ax(k)+Bu(k)
$$
    即，从当前时刻 $k$ 的系统状态和系统输入，通过模型矩阵A和B，推导出下一时刻$k+1$的系统状态

    其中，系统状态 $x$ 和 系统输入 $u$ 可以是多元的，该方程适用于MIMO系统

    这里和 Kalman Filter不同的是，KF通常只外推一步，但是MPC通常会外推多步，这个步数我们称为 `预测区间 Predictive Horizon` ，我们用 $N$ 表示
* 开始预测
    想象一下，我们通过当前系统状态和系统输入 通过模型得到下一个系统状态，然后配合下一个系统输入得到下下个系统状态，以此类推，一共推N次；于是我们就会得到一系列的系统状态和系统输入，并且做出如下定义：
$$X_k=\begin{bmatrix} x(k \mid k) \\ x(k+1 \mid k) \\ x(k+2 \mid k)\\...\\ x(k+N \mid k) \end{bmatrix}\tag{1}$$
以及 
$$U_k=\begin{bmatrix} u(k \mid k) \\ u(k+1 \mid k) \\ u(k+2 \mid k)\\...\\ u(k+N-1 \mid k) \end{bmatrix}\tag{2}$$

    > 以u(k+1 | k)举例，表示在k时刻预测k+1时刻需要做出为u(k+1 | k)的输出

    > 为什么x和u没对齐？
    > 因为是用k+N-1时刻的状态和输入推导出的k+N时刻的系统状态
    
    至此结束递推

### 系统引入
假定存在一个系统$$output\ y=x \\ reference\ R=0$$
于是可以定义
误差(Error):$$E=y-R=X-0=X$$
代价函数(Cost Function):$$J=\sum^{N-1}_{i=0}(x(k+i \mid k)^T Q x(k+i \mid k)+u(k+i \mid k)^T R u(k+i \mid k))\\+\ x(k+N \mid k)^T F x(k+N \mid k)$$
显然，代价函数分为三部分：
矩阵Q对应项是`过程误差加权和`，矩阵R对应项时`过程输入加权和`，矩阵F对应项时`终端误差加权和`
> 其中，矩阵Q R F均为对角矩阵

然后我们优化的最终目标就是让代价函数J的值取到最小：$min\ J$

### 公式变形

由于我们真正的被控量是U，因此这里我们需要进行第一次系统变形，将J中的X消除掉，使其和二次规划中的公式对齐（只有一个自变量）
首先，易得：
$$x(k \mid k) = x(k) (初始条件)
$$
$$
x(k+1 \mid k) = Ax(k \mid k)+Bu(k \mid k) = Ax_k+Bu(k \mid k) \tag{3}
$$
$$
x(k+2 \mid k) = Ax(k+1 \mid k)+Bu(k+1 \mid k) \tag{4}
$$
将$(3)$式代入$(4)$式中有：
$$
x(k+2 \mid k) = A^2x_{k}+ABu(k \mid k)+Bu(k+1 \mid k)
$$
一直递推可得：
$$ 
x(k+N \mid k)=A^N x_k + A^{N-1}Bx(k|k)+...+Bx(k+N-1|k)
$$
将上述所有递推公式汇总到一起，根据$(1)$式中的定义，汇总后左边为$X_k$，即：
$$
X_k=\begin{bmatrix} I \\ A \\ A^2 \\ ... \\ A^N \end{bmatrix}x_k+
\begin{bmatrix} 0 && 0 && ... && 0 \\ B && 0 && ... && 0 \\ 
AB && B && ... && 0  \\ && ... && ... && \\ 
A^{N-1}B &&  A^{N-2}B && ... && B\end{bmatrix} \begin{bmatrix} u(k|k) \\ u(k+1|k) \\ u(k+2|k) \\ ... \\ u(k+N-1|k) \end{bmatrix} \tag{5}
$$
根据$(2)$式中的定义，公式最右侧项为$U_k$; 
我们定义：
$$
M=\begin{bmatrix} I \\ A \\ A^2 \\ ... \\ A^N \end{bmatrix}
$$
$$
C = \begin{bmatrix} 0 && 0 && ... && 0 \\ B && 0 && ... && 0 \\ 
AB && B && ... && 0  \\ && ... && ... && \\ 
A^{N-1}B &&  A^{N-2}B && ... && B\end{bmatrix}
$$
则$(5)$式可化简为
$$X_k=Mx_k+CU_k \tag{6}$$
记住该公式的含义是 **从系统初始状态开始，依次使用$U_k$作为系统输入，经过A和B两种矩阵的长期作用后，依次得到$X_k$中的状态值**

进一步的，我们对代价函数也做一些改造
我们将代价函数J中的`过程误差加权和`项展开，连带着最后的`终端误差`项，即：
$$\sum^{N-1}_{i=0}x(k+i \mid k)^T Q x(k+i \mid k)+\ x(k+N \mid k)^T F x(k+N \mid k)=\\
\begin{bmatrix} x(k \mid k) \\ x(k+1 \mid k) \\ ...\\ x(k+N \mid k) \end{bmatrix}^T \begin{bmatrix} Q && && && \\ && Q && && \\ && &&  ... &&\\  && && && F \end{bmatrix} \begin{bmatrix} x(k \mid k) \\ x(k+1 \mid k) \\ ...\\ x(k+N \mid k) \end{bmatrix}
$$
