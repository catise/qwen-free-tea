import OpenAI from 'openai'
import * as React from 'react'
import z from 'zod'

import type { Message, Sync } from './type'

const apiKey = 'your-key-here'
export const client = new OpenAI({
  apiKey,
  /** 既然喝了千问的奶茶，当然要用千问的接口 */
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  dangerouslyAllowBrowser: true,
})

/** 声明工具 */
const tools: OpenAI.ChatCompletionFunctionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_time',
      description: '获取北京时间',
      /** 无参数 */
      parameters: z.object().optional().toJSONSchema(),
      strict: true,
    },
  },
  {
    type: 'function',
    function: {
      name: 'buy_product',
      description: '购买奶茶、饮品等商品',
      /** 有参数，类型（number、string）默认值（default）、描述（describe）也是系统提示词 */
      parameters: z
        .object({
          name: z.string().describe('商品名称'),
          quantity: z.number().default(1).describe('数量'),
          temperature: z.string().optional().describe('温度'),
          sweetness: z.string().optional().describe('甜度'),
        })
        .toJSONSchema(),
      strict: true,
    },
  },
]

/** 「历史消息」转为「对话消息」 */
const getMessages = (history: Message[]) => {
  /** 对话消息 */
  const messages: OpenAI.ChatCompletionMessageParam[] = []

  /**
   * 1. 把「历史消息」转为「对话消息」，传给模型，让模型补全对话。
   * 2. 模型输出的文字，存入「历史消息」尾部。
   * 3. 下一个新的提交触发，「历史消息」转为「对话消息」，供下一次补全使用，循环往复。
   */
  history.forEach(msg => {
    switch (msg.role) {
      case 'system':
      case 'user': {
        const message: OpenAI.ChatCompletionMessageParam = {
          role: msg.role,
          content: msg.content,
        }
        messages.push(message)
        break
      }
      case 'assistant': {
        const message: OpenAI.ChatCompletionAssistantMessageParam = {
          role: msg.role,
          content: msg.content,
          tool_calls: msg.tool_calls as any,
        }
        messages.push(message)
        break
      }
      case 'tool': {
        const message: OpenAI.ChatCompletionToolMessageParam = {
          role: msg.role,
          content: msg.content,
          tool_call_id: msg.tool_call_id!,
        }
        messages.push(message)
        break
      }
    }
  })
  return messages
}

export const chatLoop = async (sync: Sync) => {
  /** 最大循环次数，避免死循环 */
  let count = 1
  while (count < 20) {
    count++

    await chatCompletion(sync)

    const last = sync.history.at(-1)

    if (last?.finish_reason === 'stop') {
      /** 对话结束了，等待下一次提问 */
      sync.waiting = false
      sync.forceUpdate?.()
      return
    }

    if (last?.finish_reason === 'tool_calls') {
      /** 对话暂停。执行工具调用。调用完成后恢复对话 */
      for await (const tool of last.tool_calls || []) {
        const toolName = tool.function?.name || ''
        const tool_call_id = tool.id || ''
        switch (toolName) {
          case 'get_time': {
            const toolResult: Message = {
              id: `${sync.history.length}`,
              role: 'tool',
              tool_call_id,
              content: `现在北京时间是：${new Date().toLocaleString()}`,
            }
            sync.history.push(toolResult)
            break
          }
          case 'buy_product': {
            const args = JSON.parse(tool.function!.arguments || '{}')
            const product = await queryProduct(args)
            /** 把召回的商品、甜度、温度放到消息中，用于弹出卡片 */
            const card: Message = {
              id: `${sync.history.length}`,
              /** 扩展一个新的 role，用商品卡片渲染 */
              role: 'card',
              tool_call_id,
              content: '找到了下面👇的商品～喵～',
              card: { product, tool_call_id },
            }
            sync.history.push(card)
            /** 退出 while，弹出商品卡片，让 UI 层回传结果 */
            return
          }
          default:
            break
        }
      }
    }
  }
}

/**
 * args为 {"name": "卡布奇诺", "quantity": 2, "sweetness": "3分糖", "temperature": "少加冰"}
 * 模拟使用 args，在后端数据库里进行向量检索：
 *
 * 1. 召回最相关的产品
 *    - 卡布奇诺 -> skuId 347
 *
 * 2. 匹配最相关的甜度、温度
 *    - 3分糖 -> 三分糖(id=25)
 *    - 少加冰 -> 少冰(id=98)
 */
export const queryProduct = async (args: any) => {
  return {
    skuId: 347,
    name: '卡布奇诺',
    desc: '意式经典｜口感细腻，醇香饱满',
    quantity: 2,
    /** 当前激活的选项 id */
    sweetnessId: 25,
    /** UI 页面上的选项 */
    sweetness: [
      { value: 24, label: '无糖' },
      { value: 25, label: '三分糖' },
      { value: 26, label: '七分糖' },
      { value: 27, label: '全糖' },
    ],
    /** 当前激活的选项 id */
    temperatureId: 98,
    /** UI 页面上的选项 */
    temperature: [
      { value: 97, label: '去冰' },
      { value: 98, label: '少冰' },
      { value: 99, label: '常温' },
      { value: 100, label: '热' },
    ],
  }
}

export const chatCompletion = async (sync: Sync): any => {
  sync.waiting = true
  sync.forceUpdate?.()

  /** 把「历史消息」转为「对话消息」 */
  const messages = getMessages(sync.history)

  /** 调用模型接口 */
  const stream = await client.chat.completions.create({
    /** 既然喝了千问的奶茶，当然要用千问的模型 */
    model: 'qwen-flash',
    messages,
    /** 传入工具*/
    tools,
    stream: true,
  })

  for await (const event of stream) {
    const choice = event.choices[0]
    const role = choice?.delta.role
    const delta_content = choice?.delta?.content || ''

    const initMessage: Message = {
      /** 唯一 id，查找「历史消息」使用 */
      id: event.id,
      role: role || 'assistant',
      content: '',
    }

    /**「历史消息」列表里，按 id 查找当前的回复 */
    const lastMessage = sync.history.find(t => t.id === event.id)
    const message = lastMessage || initMessage

    if (!lastMessage) {
      /**
       * 查找当前的回复在「历史消息」列表里吗？
       * 1. 不在：新建一条，加入「历史消息」尾部
       * 2. 在：累加 delta content 形成完整的句子
       */
      sync.history.push(message)
    }

    if (choice?.finish_reason) {
      message.finish_reason = choice?.finish_reason
    }

    const nextContent = message.content + delta_content
    if (nextContent !== message.content) {
      /** delta content 可能是空字符串，有变化才更新 */
      message.content = nextContent
      sync.waiting = false
      sync.forceUpdate?.()
    }

    /** tool也是 token 序列，要累加一下 */
    choice?.delta?.tool_calls?.forEach(delta_tool => {
      sync.waiting = true
      const tool_calls = (message.tool_calls = message.tool_calls || [])
      const tool = tool_calls[delta_tool.index]
      if (!tool) {
        tool_calls[delta_tool.index] = delta_tool
        return
      }
      tool.id = tool.id || delta_tool.id
      tool.function = tool.function || delta_tool.function
      const args =
        (tool.function?.arguments || '') +
        (delta_tool.function?.arguments || '')
      if (args !== tool.function?.arguments) {
        tool.function!.arguments = args
      }
    })
  }
}

export function useSyncState<T>(value: T & { forceUpdate?: () => void }) {
  const [, setValue] = React.useState(1)
  const forceUpdate = () => setValue(previous => previous + 1)

  const ref = React.useRef(value)

  ref.current.forceUpdate = forceUpdate

  return ref.current
}
