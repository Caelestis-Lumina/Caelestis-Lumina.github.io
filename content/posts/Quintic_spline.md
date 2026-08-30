+++
title = "[轨迹规划] 五次样条的系数推导"
date = 2026-08-30T12:00:00+08:00
draft = true
article_status = "permanent"
applicable_versions = ["all"]
comments = true
columns = ["规划", "规划/轨迹规划", "规划/轨迹规划/时间参数化与插值"]
tags = []
+++

## 写在前面

五次样条的核心思路并不复杂：先用 $b_0,b_1,b_2$ 满足起点的位置、速度和加速度，再用 $b_3,b_4,b_5$ 满足终点的三个边界条件。下面从归一化时间开始，逐步推导各项系数。

## 五次多项式

使用归一化时间：

$$
\tau=\frac{t}{T},\qquad \tau\in[0,1]
$$

轨迹写成：

$$
q(\tau)=b_0+b_1\tau+b_2\tau^2+b_3\tau^3+b_4\tau^4+b_5\tau^5
$$

这里先按单个关节讲。多个关节完全一样，只是 $q,b_i$ 变成向量。

由于：

$$
\tau=\frac{t}{T}
$$

所以真实时间下的速度是：

$$
\dot q(t)=\frac{1}{T}\frac{dq}{d\tau}
$$

加速度是：

$$
\ddot q(t)=\frac{1}{T^2}\frac{d^2q}{d\tau^2}
$$

先对 $\tau$ 求导：

$$
\frac{dq}{d\tau}=b_1+2b_2\tau+3b_3\tau^2+4b_4\tau^3+5b_5\tau^4
$$

$$
\frac{d^2q}{d\tau^2}=2b_2+6b_3\tau+12b_4\tau^2+20b_5\tau^3
$$

---

## 代入起点条件

起点对应 $\tau=0$。

### 起点位置

$$
q(0)=q_0
$$

代入：

$$
b_0=q_0
$$

### 起点速度

$$
\dot q(0)=v_0
$$

而：

$$
\dot q(0)=\frac{b_1}{T}
$$

所以：

$$
b_1=Tv_0
$$

### 起点加速度

$$
\ddot q(0)=a_0
$$

而：

$$
\ddot q(0)=\frac{2b_2}{T^2}
$$

所以：

$$
b_2=\frac12T^2a_0
$$

到这里：

$$
b_0,b_1,b_2
$$

已经被起点条件完全确定了。

---

## 代入终点位置条件

终点是：

$$
\tau=1
$$

终点位置要求：

$$
q(1)=q_1
$$

代入多项式：

$$
b_0+b_1+b_2+b_3+b_4+b_5=q_1
$$

把已知的前三项移到右边：

$$
b_3+b_4+b_5=q_1-b_0-b_1-b_2
$$

定义：

$$
\Delta q=q_1-b_0-b_1-b_2
$$

因此：

$$
\boxed{b_3+b_4+b_5=\Delta q}
$$

这是第一个方程。

---

## 代入终点速度条件

终点速度要求：

$$
\dot q(1)=v_1
$$

因为：

$$
\dot q(1)=\frac{1}{T}
\left(
b_1+2b_2+3b_3+4b_4+5b_5
\right)
$$

所以：

$$
b_1+2b_2+3b_3+4b_4+5b_5=Tv_1
$$

把已知项移到右边：

$$
3b_3+4b_4+5b_5=Tv_1-b_1-2b_2
$$

定义：

$$
\Delta v=Tv_1-b_1-2b_2
$$

因此：

$$
\boxed{3b_3+4b_4+5b_5=\Delta v}
$$

这是第二个方程。

注意这里的 $\Delta v$ 不是普通的速度差，而是归一化时间下的“剩余速度条件”。

---

## 代入终点加速度条件

终点加速度要求：

$$
\ddot q(1)=a_1
$$

因为：

$$
\ddot q(1)=\frac{1}{T^2}
\left(
2b_2+6b_3+12b_4+20b_5
\right)
$$

所以：

$$
2b_2+6b_3+12b_4+20b_5=T^2a_1
$$

把已知项移到右边：

$$
6b_3+12b_4+20b_5=T^2a_1-2b_2
$$

定义：

$$
\Delta a=T^2a_1-2b_2
$$

因此：

$$
\boxed{6b_3+12b_4+20b_5=\Delta a}
$$

这是第三个方程。

---

## 整理边界方程

为了看得清楚，令：

$$
x=b_3,\qquad y=b_4,\qquad z=b_5
$$

得到：

$$
x+y+z=\Delta q
\tag{1}
$$

$$
3x+4y+5z=\Delta v
\tag{2}
$$

$$
6x+12y+20z=\Delta a
\tag{3}
$$

现在就是一个普通的三元一次方程组。

---

## 消元求解

### 第一步：用方程2减去方程1的3倍

方程1乘3：

$$
3x+3y+3z=3\Delta q
$$

用方程2减它：

$$
(3x+4y+5z)-(3x+3y+3z)=\Delta v-3\Delta q
$$

得到：

$$
\boxed{y+2z=\Delta v-3\Delta q}
\tag{4}
$$

---

### 第二步：用方程3减去方程1的6倍

方程1乘6：

$$
6x+6y+6z=6\Delta q
$$

方程3减它：

$$
(6x+12y+20z)-(6x+6y+6z)=\Delta a-6\Delta q
$$

得到：

$$
\boxed{6y+14z=\Delta a-6\Delta q}
\tag{5}
$$

---

### 第三步：求 $z=b_5$

方程4乘6：

$$
6y+12z=6\Delta v-18\Delta q
$$

用方程5减去这个式子：

$$
(6y+14z)-(6y+12z)
=\Delta a-6\Delta q-\left(6\Delta v-18\Delta q\right)
$$

左边：

$$
2z
$$

右边：

$$
\Delta a-6\Delta v+12\Delta q
$$

所以：

$$
2z=\Delta a-6\Delta v+12\Delta q
$$

因此：

$$
z=6\Delta q-3\Delta v+\frac12\Delta a
$$

也就是：

$$
\boxed{
b_5=6\Delta q-3\Delta v+\frac12\Delta a
}
$$

---

## 求 $y=b_4$

从方程4：

$$
y+2z=\Delta v-3\Delta q
$$

所以：

$$
y=\Delta v-3\Delta q-2z
$$

代入刚才的 $z$：

$$
y=\Delta v-3\Delta q-2\left(
6\Delta q-3\Delta v+\frac12\Delta a
\right)
$$

展开：

$$
y=
\Delta v-3\Delta q
-12\Delta q+6\Delta v-\Delta a
$$

整理：

$$
y=-15\Delta q+7\Delta v-\Delta a
$$

因此：

$$
\boxed{
b_4=-15\Delta q+7\Delta v-\Delta a
}
$$

---

## 求 $x=b_3$

从方程1：

$$
x+y+z=\Delta q
$$

所以：

$$
x=\Delta q-y-z
$$

代入 $y,z$：

$$
x=\Delta q-\left(
-15\Delta q+7\Delta v-\Delta a
\right)
-\left(
6\Delta q-3\Delta v+\frac12\Delta a
\right)
$$

展开：

$$
x=
\Delta q
+15\Delta q
-7\Delta v
+\Delta a
-6\Delta q
+3\Delta v
-\frac12\Delta a
$$

整理：

$$
x=10\Delta q-4\Delta v+\frac12\Delta a
$$

因此：

$$
\boxed{
b_3=10\Delta q-4\Delta v+\frac12\Delta a
}
$$

---

## 最终结果

$$
\boxed{
b_3=10\Delta q-4\Delta v+\frac12\Delta a
}
$$

$$
\boxed{
b_4=-15\Delta q+7\Delta v-\Delta a
}
$$

$$
\boxed{
b_5=6\Delta q-3\Delta v+\frac12\Delta a
}
$$

其中：

$$
\Delta q=q_1-(b_0+b_1+b_2)
$$

$$
\Delta v=Tv_1-(b_1+2b_2)
$$

$$
\Delta a=T^2a_1-2b_2
$$

而：

$$
b_0=q_0
$$

$$
b_1=Tv_0
$$

$$
b_2=\frac12T^2a_0
$$

---

## 零速度、零加速度的特殊情况

假设：

$$
v_0=v_1=0
$$

$$
a_0=a_1=0
$$

那么：

$$
b_0=q_0,\qquad b_1=0,\qquad b_2=0
$$

所以：

$$
\Delta q=q_1-q_0
$$

$$
\Delta v=0
$$

$$
\Delta a=0
$$

代入：

$$
b_3=10(q_1-q_0)
$$

$$
b_4=-15(q_1-q_0)
$$

$$
b_5=6(q_1-q_0)
$$

因此：

$$
q(\tau)=
q_0+(q_1-q_0)
\left(
10\tau^3-15\tau^4+6\tau^5
\right)
$$

这里的 $10,-15,6$ 并不是凭经验选出来的，而是解下面三个终点方程得到的：

$$
b_3+b_4+b_5=q_1-q_0
$$

$$
3b_3+4b_4+5b_5=0
$$

$$
6b_3+12b_4+20b_5=0
$$

它们分别保证：

* 终点位置正确；
* 终点速度为0；
* 终点加速度为0。
