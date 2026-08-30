+++
title = "[视觉] 单视图几何与单视图测量"
date = 2026-08-30T12:00:00+08:00
draft = true
article_status = "permanent"
applicable_versions = ["all"]
comments = true
columns = ["感知", "感知/计算机视觉", "感知/计算机视觉/几何视觉"]
tags = []
+++

## 写在前面
本文讨论如何利用单幅图像中的几何约束，将像素坐标与世界坐标联系起来。可以把它理解为沿着相机投影流程反向推导，但单幅图像能够恢复的信息仍然取决于已知约束。

## 预备概念
### 各种变换的基础概念
欧式变换、相似变换、仿射变换和透视变换的自由度依次增加，后者能够表示前者：

* 欧式变换只改变方向和位置，不改变形状和大小；
* 相似变换允许整体缩放，但不改变形状；
* 仿射变换不改变平行性；
* 透视变换还可以改变平行关系。

这里仅对2D透视变换做出公式说明：

$$\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix}=\begin{bmatrix} a & b & x_0 \\ c & d & y_0 \\ v_1 & v_2 & 1 \end{bmatrix}\begin{bmatrix} x \\ y \\ 1 \end{bmatrix}$$
$$\Rightarrow\boldsymbol{x'}=\begin{bmatrix} \boldsymbol{A} & \boldsymbol{t}  \\ \boldsymbol{v^T} & 1  \end{bmatrix} \boldsymbol{x}=\boldsymbol{H}\boldsymbol{x}$$
其中各部分定义如下：
| 分块                 | 维度         | 名称        | 含义                           |
| ------------------ | ---------- | --------- | ---------------------------- |
| $\boldsymbol{A}$   | $3\times3$ | **线性变换**  | 旋转、缩放、剪切等仿射线性部分              |
| $\boldsymbol{t}$   | $3\times1$ | **平移向量**  | 纯平移                          |
| $\boldsymbol{v}^T$ | $1\times3$ | **透视参数**  | 决定无穷远点如何映射到有限点，产生"近大远小"的透视效果 |
| $1$                | $1\times1$ | **归一化基准** | 齐次坐标尺度，固定为 1（保证矩阵可分解为上述标准形式） |


如果是在3D中的变换，则 $\boldsymbol{A}$ 为3\*3的矩阵，$\boldsymbol{t}$ 为3\*1的向量，$\boldsymbol{v^T}$ 为1\*3的向量，$\boldsymbol{x}$ 和 $\boldsymbol{x'}$ 均为4\*1的向量，依旧与之前的定义保持一致，变换都在齐次空间中完成
因此一共存在 15 个自由度，其中 $A$ 有 9 个、$t$ 有 3 个、$v$ 有 3 个。

### 直线求交点
以二维齐次坐标为例，如果点 $x=\begin{bmatrix} x \\ y \\ 1 \end{bmatrix}$ 在直线 $l=\begin{bmatrix} l_1 \\ l_2 \\ l_3 \end{bmatrix}$ 上，则有 $x^Tl=l^T x=0$。
又因为两条直线（向量）的叉积等于**垂直于**这两条直线所成平面的向量，所以这个向量与这两条直线的点积均为0
因此可以推出：$l$和$l'$交点$x=l \times l'$

上述结论推广到三维亦成立

### 无穷远点
无穷远点的坐标在等阶次的空间中并不好描述，比如在三维空间描述三维无穷点，在二维空间描述二维无穷点，必须要引入一个inf的变量，这会导致计算变得复杂
因此，我们通常会在更高一阶的[齐次空间](/posts/coodinate_transformation_between_homogeneous_and_euclidean_space/)中描述无穷远元素。当**齐次坐标最后一维为 0** 时，它表示方向或无穷远点，而不是有限位置。

借此，我们可以定义两条平行线的交点：
假设$l=\begin{bmatrix} a \\ b \\ c \end{bmatrix}$, $l'=\begin{bmatrix} a' \\ b' \\ c' \end{bmatrix}$,  且两条直线平行 $\Rightarrow -a/b = -a'/b'$
则两条直线交于 $x_\infty=\begin{bmatrix} b \\ -a \\ 0 \end{bmatrix}$。它可以理解为给二维方向补充一个值为 0 的齐次维度。
进而可推得，无穷远点的集合都在一条**无穷远线** $l_\infty=\begin{bmatrix}0 \\ 0 \\ 1\end{bmatrix}$上

### 推广到三维
#### 三维的无穷远点
如果已知两条直线平行，且其中一条直线的方向向量为 $l=\begin{bmatrix}a \\ b \\ c\end{bmatrix}$,  则两条直线的交点（无穷远点）表达为$\boldsymbol{x}_\infty=\begin{bmatrix}a\\b\\c\\0\end{bmatrix}$（依旧在齐次坐标系下表示）
那么，显然，所有的无穷远点都在无穷远面 $\prod_\infty=\begin{bmatrix}0\\0\\0\\1\end{bmatrix}$上（乘一下不难得到）
#### 无穷远线与无穷远面
这里不展开推导，后文会继续说明影消线与平面法向量的关系。
### 影消点与影消线
**透视变换**会改变图形的平行性，因此三维空间中的平行线投影到图像后可以交于同一个影消点。下面用齐次坐标说明这一点：
假设一透视变换 $\boldsymbol{H}=\begin{bmatrix} \boldsymbol{A} & \boldsymbol{t}  \\ \boldsymbol{v^T} & 1  \end{bmatrix}$,   还有一无穷远点 $\boldsymbol{p}=\begin{bmatrix}p_x \\ p_y \\ 0\end{bmatrix}$，设该无穷远点经过透视变换后的点坐标为 $\boldsymbol{p'}=\begin{bmatrix}p_x' \\ p_y' \\ p_z'\end{bmatrix}$
由矩阵乘法可得 $p_z'=v_1 p_x + v_2 p_y$。如果 $\boldsymbol{v^T}$ 和 $\boldsymbol{p}$ 不满足使该值为 0 的特殊关系，那么投影结果不再是无穷远点，而是有限坐标。

同一平面内不同方向的影消点组成的直线，称为该平面的影消线。

### 影消线和平面法向量的关系

设任意一个平面在世界坐标系下的法向量为 $n_{world}$。假设相机相对于世界坐标系的旋转矩阵为 $R$，平移向量为 $t$，相机的内参矩阵为 $K$

首先取平面内任意三维方向向量 $v_{world}$。由于 $v_{world}$ 与法向量垂直，因此满足：

$$n_{world}^T v_{world} = 0$$

在世界空间中，代表该方向的无穷远点可以写成 $(v_{world}^T, 0)^T$。
将它通过相机投影矩阵 $P = K[R \mid t]$ 投影到相机的二维图像上，得到无穷远点（也就是影消点） $x_\infty$：$$x_\infty = K[R \mid t] \begin{bmatrix} v_{world} \\ 0 \end{bmatrix} = K R v_{world}$$
利用“点在线上”的齐次性质因为这个无穷远点必定落在该平面的影消线 $l$ 上，所以满足点线方程 $l^T x_\infty = 0$。代入上式：$$l^T (K R v_{world}) = 0$$利用矩阵转置性质化简：$$(R^T K^T l)^T v_{world} = 0$$核心对比：对比最初的条件 $n_{world}^T v_{world} = 0$ 与最终的 $(R^T K^T l)^T v_{world} = 0$，对所有的切向向量 $v_{world}$ 均成立，最终可推得普遍公式：$$n_{world} \sim R^T K^T l$$

当相机坐标系与世界坐标系重合时，外参旋转矩阵 $R$ 退化为单位矩阵，此时有：

$$n = K^T l$$

从几何上看，在相机坐标系中，像素点 $x$ 对应的三维射线方向为 $d \sim K^{-1}x$。相机光心与影消线 $l$ 共同确定一个解释平面（Interpretation Plane）。

如果射线投影在直线 $l$ 上，则满足 $l^Tx=0$。代入 $x=Kd$ 后可得 $l^TKd=0$，即 $(K^Tl)^Td=0$。因此，$K^Tl$ 垂直于解释平面内的所有射线方向，是解释平面的法向量。解释平面与对应物理平面共享无穷远线，因此二者平行并具有相同的法向量方向。
更直观的三步解释见[影消线与平面法向量的关系](/posts/the_relationship_between_vanishing_lines_and_plane_normals/)。
