import OpenAI from 'openai'

/** 历史消息 */
export interface Message {
  /** 消息唯一 id */
  id: string
  /**
   * role 是 openai 定义的，表明消息的类型。
   * 不同的 role， <Bubble /> 的 header、avatar、placement 应该渲染不同的内容
   */
  role: 'system' | 'user' | 'assistant' | 'tool' | 'developer' | 'card'
  /** 消息的内容。由 <Bubble /> 的 content 渲染 */
  content: string
  /** 停止原因 */
  finish_reason?: OpenAI.ChatCompletionChunk.Choice['finish_reason']
  /** 待执行的工具列表 */
  tool_calls?: {
    id?: string
    type?: 'function'
    function?: {
      name?: string
      arguments?: string
    }
  }[]
  /** 已经完成执行的工具 id，执行结果放在 content 字段里 */
  tool_call_id?: string
  /** 在后端数据库里进行向量检索后，召回的商品、甜度、温度的实体 ID */
  card?: {
    tool_call_id: string
    product: {
      name?: string
      desc?: string
      quantity?: number
      /** 当前激活的选项 id */
      sweetnessId?: number
      /** UI 页面上的选项 */
      sweetness?: { value: number; label: string }[]
      /** 当前激活的选项 id */
      temperatureId?: number
      /** UI 页面上的选项 */
      temperature?: { value: number; label: string }[]
    }
    disabled?: boolean
  }
}

export interface Sync {
  /** 历史消息 */
  history: Message[]
  /** 消息第一个词，是否在等待中 */
  waiting: boolean
  /** 更新 UI 页面 */
  forceUpdate?: () => void
}
