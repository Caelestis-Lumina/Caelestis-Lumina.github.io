+++
title = "[MPC] 模型预测控制公式的数学推导"
date = 2026-08-30T12:00:00+08:00
draft = false
article_status = "permanent"
applicable_versions = ["all"]
comments = true
columns = ["控制", "控制/最优控制", "控制/最优控制/MPC"]
tags = ["控制", "机器人"]
+++

## 写在前面
模型预测控制 `Model Predictive Control` 是一种基于模型、能够滚动预测、优化、执行的闭环控制算法；用白话讲，就是拿到系统状态后，计算未来应施加怎样的系统输入或控制量，才能让系统达到“可见范围内的最优”；
该控制算法擅长处理多变量耦合、约束和预测控制问题，但依赖模型并且在线计算量较大

## 具体公式推导
### 二次规划 Quadratic Programming
这部分其实和LQR差别不大，我们的核心目标都是最小化代价函数，只不过MPC的代价函数可以更复杂
$$
Q=\begin{bmatrix} q1 && && && \\ && q2 && && \\ && &&  ... &&\\  && && && q_n \end{bmatrix}
$$
一般来说，优化目标是找到 $Q$ 使得:
$$
min(z^T Q z + C^T z) \tag{*}
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
> 注意：上述向量中的成员$x(k+i | k)$均为n行的列向量
> 因此，$X_k$是一个(N+1)*n行，1列的列向量，并非矩阵

以及 
$$U_k=\begin{bmatrix} u(k \mid k) \\ u(k+1 \mid k) \\ u(k+2 \mid k)\\...\\ u(k+N-1 \mid k) \end{bmatrix}\tag{2}$$

> 以$u(k+1 | k)$举例，表示在$k$时刻预测$k+1$时刻需要做出为$u(k+1 | k)$的输出

> 为什么x和u没对齐？
> 因为是用k+N-1时刻的状态和输入推导出的k+N时刻的系统状态
    
至此结束递推

### 系统引入
假定存在一个系统$$output\ y=x \\ reference\ r=0$$
于是可以定义
误差(Error):$$E=y-r=X-0=X$$
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
x(k+N \mid k)=A^N x_k + A^{N-1}Bu(k|k)+...+Bu(k+N-1|k)
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
> M中每一项成员都是n\*n的(n是状态x的维数)，因此M的尺寸是(N+1)\*n行，n列（N是预测区间的大小）

$$
C = \begin{bmatrix} 0 && 0 && ... && 0 \\ B && 0 && ... && 0 \\ 
AB && B && ... && 0  \\ && ... && ... && \\ 
A^{N-1}B &&  A^{N-2}B && ... && B\end{bmatrix}
$$
> C 是一个 (N+1)\*n 行，N\*p 列的矩阵，p是B的列数，也是系统输入的维度数

则$(5)$式可化简为
$$X_k=Mx_k+CU_k \tag{6}$$
记住该公式的含义是 **从系统初始状态开始，依次使用$U_k$作为系统输入，经过A和B两种矩阵的长期作用后，依次得到$X_k$中的状态值**

进一步的，我们对代价函数也做一些改造
我们将代价函数J中的`过程误差加权和`项展开，连带着最后的`终端误差加权和`项，即：
$$\sum^{N-1}_{i=0}x(k+i \mid k)^T Q x(k+i \mid k)+\ x(k+N \mid k)^T F x(k+N \mid k)\\
=\begin{bmatrix} x(k \mid k) \\ x(k+1 \mid k) \\ ...\\ x(k+N \mid k) \end{bmatrix}^T \begin{bmatrix} Q && && && \\ && Q && && \\ && &&  ... &&\\  && && && F \end{bmatrix} \begin{bmatrix} x(k \mid k) \\ x(k+1 \mid k) \\ ...\\ x(k+N \mid k) \end{bmatrix}\\
=X_k^T \bar{Q} X_k
$$
同理：
$$
\sum^{N-1}_{i=0}u(k+i \mid k)^T R u(k+i \mid k)=U^T_k \bar{R} U_k
$$
整合后有：
$$
J=X_k^T \bar{Q} X_k+U^T_k \bar{R} U_k \tag{7}
$$
将式(6)代入式(7)中，则有
$$
J=(Mx_k+CU_k)^T\bar{Q}(Mx_k+CU_k)+U^T_k \bar{R} U_k\\
=(x_k^T M^T + U_k^T C^T)\bar{Q}(Mx_k+CU_k)+U^T_k \bar{R} U_k\\
=x_k^T M^T \bar{Q} Mx_k + x_k^T M^T \bar{Q} CU_k + U_k^T C^T\bar{Q}Mx_k +  U_k^T C^T\bar{Q}CU_k + U^T_k \bar{R} U_k \tag{8}
$$
不难发现，代价函数的输出J是一个数值，这就意味着式(8)中的每一项都是一个值
此外，众所周知，标量的转置是它本身，因此，式(8)中的第二和第三项的值应当相同（互为转置），则有：
$$
J=x_k^T M^T \bar{Q} Mx_k + 2x_k^T M^T \bar{Q} CU_k +  U_k^T C^T\bar{Q}CU_k + U^T_k \bar{R} U_k \tag{9}
$$
(最后两项可以用分配律整合) 令
$$
G=M^T \bar{Q} M\\
E=M^T \bar{Q} C \\
H=C^T \bar{Q}​C+\bar{R}
$$
将上述的令作代入式(9)可得
$$
J=x_k^T G x_k + 2x_k^T E U_k +  U_k^T H U_k \tag{10}
$$
我这里把式(\*)再抄下来
$$
min(z^T Q z + C^T z) \tag{*}
$$
可以看到式(10)中$U_k$是自变量，$x_k$是由k时刻决定的常量，因此其中第一项是常量，对$min \ J$没有影响
再看其他两项，对比式(\*)可知：
式(10)中的第三项对应式(\*)中的第一项；式(10)中的第二项对应式(\*)中的第二项

至此，我们已经完成了所有的必要公式推导
