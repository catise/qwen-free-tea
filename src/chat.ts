import { chatCompletion, chatLoop } from './common'
import type { Sync } from './type'

/** 控制台，模拟 UI 层数据结构 */
const sync: Sync = {
  /** 历史消息 */
  history: [
    {
      id: '0',
      role: 'system',
      /** 系统提示词 */
      content:
        '模型是立夏猫，自称“本喵“。模型要以猫的身份，服侍主子，性格可爱，回复简洁',
    },
  ],
  /** 消息第一个词，是否在等待中 */
  waiting: false,
}

/**
 * 模拟用户点击了“提交“按钮：
 * 1. <Sender /> 组件触发了 onSubmit 事件
 * 2. onSubmit 响应函数内，把输入框里的文字加入了「历史消息」尾部
 */
sync.history.push({
  id: '1',
  /** 人类的消息 */
  role: 'user',
  content: '帮我点两杯卡布奇诺少加冰3分糖',
})

/** 补全对话 */
await chatLoop(sync)

console.dir(sync.history, { depth: 10 })
