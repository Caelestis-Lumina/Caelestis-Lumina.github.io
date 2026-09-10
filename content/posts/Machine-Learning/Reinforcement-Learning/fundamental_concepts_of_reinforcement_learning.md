+++
title = "[强化学习] 基础概念"
date = 2026-09-10T12:00:00+08:00
draft = false
article_status = "permanent"
applicable_versions = ["all"]
comments = true
tags = []
+++

## 写在前面
本博客主要汇总强化学习的基础概念，从Random Variable到开始训练的所有环节，方便日后查阅
如有侵权，联系删除
## 目录
* Fundamentals of Probability Theory
* Fundamental Concepts of RL

## Fundamentals of Probability Theory
Random Variable 随机变量(Represented by an uppercase letter X)
Possible Values 可能值(Represented by a lowercase letter x)
Random Events 随机事件

the relationships between these concepts are as follows: 
A Random Variable is a set of all Possible Values，and each Possible Values coresponds to a specific Random Event.
这个概念不难，但是用的很多，需要明确

### Probability Density Function
概率密度函数仅用于连续分布中；在离散分布中，使用概率质量函数
（也有一些书统一使用概率密度函数，影响不大，只要知道这俩描述的是相近的概念即可）
这个概念和密度非常像，都是表示单位区域内的质量/发生概率
$$
密度*区域的积分=质量\\
\int_{\mathcal{X}}p(x)dx = probability\\
\Sigma_{x∈\mathcal{X}}P(x) = probability
$$
“区域”用常用花体X表示

### Expectation
期望就是每个小区域的值*该小区域发生的概率，然后将目标范围中的所有小区域加起来
$$
\mathbb{E}[f(x)] = \int_{\mathcal{X}}p(x)·f(x)dx
$$

### Independent Random Sampling
独立随机采样/随机抽样，最常见最泛用的抽样方式
举例：箱子摸**一次**彩球，抛**一次**硬币等，都属于进行了**一次**独立随机采样

## Fundamental Concepts of RL
### state && action
* 状态和行动，
* 状态是一个坐标点，坐标轴可以是任意系统量，我们说“系统的状态”，实际上是在描述一个高位空间中的一个点
* 行动是一个向量，但是向量不是任意的，在不同状态下可以使用的向量也有可能不同；
比如你在T字路口，你可以选择的向量是左右后；在十字路口则可以选择前后左右；
* 对一个state使用一次action，就会来到一个new state
* 拥有state，并且可以执行action的对象被称为agent
* 这两个概念时刻贯穿强化学习，请务必牢记
### policy function
* 决策π函数
* 决策指的是在被控对象(后面均使用agent表示对象)处于状态s时，下一步会做出的所有action的概率的集合，对应公式如下：
$$
\pi(a|s)=\mathbb{P}(A=a|S=s)
$$
比如现在正处于状态s，然后此时一共有3种action可供选择，那么agent分别有p1, p2, p3的概率执行action, a1, a2, a3，然后agent做一次随机采样，将得到的action作为下一步要执行的实际行为
### reward
* 奖励
* 根据系统的实际情况定制，每个agent处于不同的environment时，通常会设置不同的reward
* agent的最终目标就是获取最大的reward
### state transition
* 状态转移
* 指从一个state转移到另一个state的过程
* state transition**仅依赖于environment**，不受agent控制（这点很重要），因此具有一定的随机性
* 这个概念在Markov chain中会用到（未来的状态仅与状态有关，并不关心过去的经历）
* 具体公式：
	* When state equals s and action equals a, the probability that the next state is s' is p
	$$
p(s'|s,a)=\mathbb{P}(S'=s'|S=s,A=a)
$$
### agent environment interaction
* 智能体与环境的交互机制
* Environment tells agnet current state，the agent makes a decision based on the current state and policy, then executes the action corresponding to that decision. When system reaches the next state，environment will tell agent reward of executing the previous action
### Randomness in RL
* 强化学习的随机性
* 随机性主要发生actions本身和state transitions的过程中
* 具体公式：
	* When agent is given state s, the action can be random.
	$$
	A\sim\pi(\cdot \mid s)\\
	给定状态 s，策略 π 定义在动作空间上的分布
$$
( · 表示在条件s下的完整分布，而不是某个具体action的概率)
	* Given state S equals s and action A equals a, the environment randomly generates a new state S'
	哪怕在相同的状态下做出相同的决策，但是最终也不一定来到相同的新状态
	$$
	S'\sim p(\cdot \mid s, a)
$$
### trajectory
* 轨迹
* 从游戏开始到结束的过程中，包含的所有(state, action, reward)组成的序列
### Reward and Return
* 奖励与回报
* 奖励是执行一个action之后，环境告诉agent的“获利数量”
回报是一轮完整游戏结束后，对所有reward的汇总
* discounted return 折扣回报 $U_t$
即未来的奖励折算到现在需要打折扣，因为它有概率无法被兑现
而且越遥远未来的奖励需要打的折扣越多，这样MDP的return才是有限的
$$
U_t=R_t+\gamma R_{t+1}+\gamma^{2} R_{t+2}+\gamma^{3} R_{t+3}+\dots 
=\mathbb{E_{\pi}}[\sum^{\infty}_{t=0}\gamma^tr_{t+1}\mid s_0=s, a_0=a]
$$
通常，我们用`r`表示已经发生的确定的奖励，用`R`表示未来的未知的奖励
因为 $U_t$ 仅包含 $t$ 时刻之后的奖励，因此公式中只有R，没有r
$r$ 没有折扣率
* 同样，因为action和state transition存在随机性，因此return也具有随机性

### Value Function Q(s, a)
* 请务必理解贝尔曼期望方程，否则会影响后期对算法的理解 
* 离散和连续系统并没有本质区别，只需要理解下面的公式在做什么即可
* Bellman贝尔曼期望方程
	* 概括地讲就是：「当前一步的期望回报」加上「后续的折扣价值」
* 价值函数(细分为动作价值函数$Q_{\pi}$, 最优动作价值函数$Q_{\star}$, 状态价值函数$V_{\pi}$)
	* Action-value function for policy $\pi$
		* 表示在状态 s 下采取动作 a ，之后严格按照策略 π 执行时，能够获得的累计折扣回报的期望
		* $$Q_{\pi}(s_t, a_t)=\mathbb{E}\bigl[U_t \mid S_t=s_t, A_t=a_t\bigr]$$
		* 由于t时刻及其之后的行动和状态均不可知，因此Ut是一个变量
		* 因此我们用Ut的期望来评估Ut的值，这个期望记作$Q_{\pi}$
	* 动作价值函数的贝尔曼期望方程 **（这部分很重要）**
		* $$Q_{k+1}(s,a)=\sum_{s'}P(s'|s,a)\Bigl[R(s,a,s')+\gamma\sum_{a'}\pi(a'|s')\,Q_k(s',a')\Bigr] $$
		* $R(s,a,s')$表示当agent在状态 𝑠 下执行动作 𝑎，并转移到下一个状态 𝑠′ 时，环境给予的即时奖励（immediate reward），这里代表agnet在$t$时刻的状态为s，并采取了行动a，来到新状态s‘后，得到的奖励
		* 根据前面的定义可知，动作a的概率密度函数是policy function $\pi(a\mid s)$，状态s的概率密度函数是state transition $p(s'\mid s, a)$
		* 外层对 s′ 按状态转移概率加权；内层对 **下一步动作 a′** 按策略 π(a′|s′) 加权；
		* $\sum_{s'}：$遍历 **当前状态是s，并作出行动a后，所有可能的状态s‘**
		* $\sum_{a'}：$遍历 **当前状态是s'，所有可能作出的行为a‘**
		* $\sum_{a'}\pi(a'|s')\,Q_k(s',a')$ ：对 **当前状态为s'，并作出行为a'后，未来的折扣回报** 加权求和，加的权就是 $\pi(a'|s')$ ，也就是这种未来发生的可能性，也就是agent作出这种决策的可能性
		* **综上所述：** 对于$Q_{k+1}(s,a)$来说，其值的影响因素有且仅有$s_t$ 、 $a_t$还有策略函数$\pi$，而在每次计算时都能清楚知道当前的$s_t$和$a_t$，从而将它们代入期望方程，得到“agent在状态s，并作出行动a后的最终回报是多少”，然后就可以**评估这一步决策对应行动的优劣**了
		* 常见的计算动作价值函数的方式，就是基于Bellman期望方程的数值迭代（动态规划中的策略评估），一直迭代到两次更新之间的最大变化 Δ小于某个阈值 ε 为止（即迭代到更远的未来的收益完全可以忽略不计）
	* optimal action-value function
		* 最优动作价值函数
		* $$Q_{\star}(s_t, a_t)=\max_{\pi}Q_{\pi}(s_t, a_t)$$
		* $\max_{\pi}$就是在所有策略中，可以使动作价值函数最大化的那个策略，然后算出这个最大化回报是多少
		* 换句话说，无论如何改进策略$\pi$，最终回报都不可能大于$Q_{\star}$
		* 当我们明确找到$\max_{\pi}$，那么就可以明确知道在当前状态下，做每一个action的收益分别有多大（相当于预言），进而引导agent进行决策
	* state-value function
		* 状态价值函数
		* $$V_{\pi}(s_t)=\mathbb{E_A}[Q_{\pi}(s_t, A)]=\sum_{a}\pi(a|s)\sum_{s'}{P(s'|s,a)}\Bigl[R(s,a,s')+\gamma V_{\pi}(s')\Bigr]$$ 
		* 其中A是策略 $\pi$ 中所有可能的行为
		* 简单来说，就是对当前状态下，所有可能决策行为的回报 加权求和，从而得到当前状态下的回报期望（与行为无关，仅与当前状态和策略有关）
		* 就像下棋下到一半，我想知道当前状态下，我的胜率有多少，这时候就要用到状态价值函数（仅与当前状态和策略有关）
	* summary
		* 这三个function层层递减，return -> action-value function -> optimal action-value function -> state-value function
		* 加决策去掉了随机性的影响，加最优去掉了决策的影响、加期望去掉了action的影响
		* 可以用状态价值函数对动作价值函数进行简化：
		$$Q_{k+1}(s,a)=\sum_{s'}P(s'|s,a)\Bigl[R(s,a,s')+\gamma V_{\pi}(s_t)\Bigr] $$ 
### learning ways (这一部分后面会具体展开)
* 学习$\pi(a\mid s)$
	* 策略学习
	* Policy network
	* 由于部分场景下并不追求所谓的“赢”，只需要找到需要的规则即可
* 学习$Q_{\star}(s,a)$
	* 价值学习
	* 用Deep Q network
	* 因为Q是未来“可见”奖励的总和，因此做能让Q值更大的行为即可
