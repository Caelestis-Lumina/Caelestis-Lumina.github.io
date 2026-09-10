+++
title = "[强化学习] 价值学习"
date = 2026-08-30T12:00:00+08:00
draft = false
article_status = "permanent"
applicable_versions = ["all"]
comments = true
tags = []
+++

## Deep Q-Network (DQN)
### The interaction process between DQN and system
1. agent处于$state_t$
2. agent根据$Q_{\star}$决策并执行
3. environment根据state transition随机采样，给agent下一个状态$state_{t+1}$，同时告诉agent这一次行动的reward
4. 重复步骤123

### Gradient of DQN
DQN网络的梯度
$$\nabla_wQ(s,a;w)\triangleq \frac{\partial Q(s,a;w)}{\partial w}$$
其中$w$是网络参数，进而可以用这个梯度来优化网络参数，这在后续的TD learning会有用到
## Temporal Difference Learning
### Example引例
* 模型预测值Model predicted value $q=Q(w)$ , 实际测量值Actual measured value $y$
* $loss: L=\frac{1}{2}(q-y)^2$
* gradient梯度：$\frac{\partial L}{\partial w}=\frac{\partial q}{\partial w}·\frac{\partial L}{\partial q}=(q-y)·\frac{\partial Q（w）}{\partial w}$(y对q来说是常量，求导就没了)
* 进一步可以计算出损失对网络参数的梯度$w_{t+1}=w_t- \alpha·\frac{\partial L}{\partial w}\mid_{w=w_t}$，然后就可以用梯度下降来更新模型参数了
### 但是我们只能获得部分真实的测量值怎么办
* 这就要用到TD来优化模型了
比如我们要实现事件A，Q输出100，我们完成事件A的40%，共消耗30，此时Q输出50，那么实际+预测共计需要80，我们就可以用这个80来优化模型参数，因为相较于100，80具有更高的置信度
* 在具体实现上，我们将TD target作为actual measured value，然后重复Example中的过程，得到梯度，进行梯度下降
其中，$\hat{y}$ 为TD target，TD error $\delta \triangleq \hat{q}-\hat{y}$
* 使用TD learning的必要条件
满足等式：$Model's\ estimate \approx Actual\ number+part\ of\ model's\ estimate$
换句话说，就是只能用置信度更高的数据更新置信度更低的模型，用于更新模型的数据，必须在部分程度上否定模型的输出
应用在RL中就是：(有点类似于动作价值函数的贝尔曼期望方程)
$$
Q(s_t,a_t;w)\approx r_t+\gamma·Q(s_{t+1},a_{t+1};w)\\
U_t=R_t+\gamma · U_{t+1}
$$
其中，$Q(s_t,a_t;w)$是模型预测输出，$r_t+\gamma·Q(s_{t+1},a_{t+1};w)$是TD target
### apply TD learning to DQN
我们定义：
$$
\hat{q}_t\triangleq Q(s_t,a_t;w)
\\--------------\\
\hat{y}_t\triangleq r_t+\gamma·Q(s_{t+1},a_{t+1};w)
\\--------------\\
且有Q(s_{t+1},a_{t+1};w)=\max_aQ(s_{t+1},a;w)
$$
也就是说，我们模型作出的决策，一定是使最终回报最大化的那个动作

由于$\hat{y}_t$相比于$\hat{q}_t$包含更多的真实部分$r_t$，因此应该鼓励模型由$\hat{q}_t$向$\hat{y}_t$靠拢
我们可以复制Example中的方法，
$$
L(w)=\frac{1}{2} \bigl[Q(s_t,a_t;w)-\hat{y}_t\bigr]^2\\
\\--------------\\
\frac{\partial L}{\partial w}=(\hat{q}-\hat{y})\frac{\partial Q(s_t,a_t;w)}{\partial w}
\\--------------\\
w\leftarrow w-\alpha ·\frac{\partial L}{\partial w}\mid_{w=w_t}
$$
至此，已经可以通过TD来优化模型了

## 其他
如果不知道$\frac{\partial L}{\partial w}$怎么推导，移步[这篇博客](https://blog.csdn.net/m0_59475014/article/details/149305427)

但是实际上不知道怎么推也没关系，现在的库都为我们封装好了，调用一个方法就直接求完了，只是在项目推进的过程中总是心有缺憾罢了