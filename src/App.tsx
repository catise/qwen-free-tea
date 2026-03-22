import { GithubOutlined, SmileOutlined } from '@ant-design/icons'
import { Bubble, Sender } from '@ant-design/x'
import { XMarkdown } from '@ant-design/x-markdown'
import { Avatar, message } from 'antd'
import * as React from 'react'

import { Product } from './Product'
import { chatCompletion, chatLoop, useSyncState } from './common'
import type { Message, Sync } from './type'

import './App.css'

function App() {
  const [input, setInput] = React.useState('')
  const sync = useSyncState<Sync>({
    history: [
      {
        id: '0',
        /** 系统提示词 */
        role: 'system',
        content:
          '模型是立夏猫，自称“本喵“。模型要以猫的身份，服侍主子，性格可爱，回复简洁',
      },
    ],
    waiting: false,
  })

  const tryChat = async () => {
    try {
      await chatLoop(sync)
    } catch (e: any) {
      message.error(e.message)
      throw e
    } finally {
      sync.waiting = false
      sync.forceUpdate?.()
    }
  }

  const onSubmit = () => {
    const card = sync.history.at(-1)?.card
    if (card) {
      /** 如果商品卡片没有确认购买，又发出了新的对话，应该补一条取消购买消息 */
      const toolResult: Message = {
        id: `${sync.history.length}`,
        role: 'tool',
        tool_call_id: card.tool_call_id,
        content: '取消购买',
      }
      card.disabled = true
      sync.history.push(toolResult)
    }

    /** 新建一个消息 */
    const message: Message = {
      id: `${sync.history.length}`,
      role: 'user',
      content: input,
    }
    /** 把消息加入列表末尾 */
    sync.history.push(message)
    /** 清空输入框 */
    setInput('')
    /** 补全对话 */
    tryChat()
  }

  return (
    <div className="app">
      <div className="chat-list">
        {sync.history.map(message => {
          const key = `${message.id}`
          const content = message.content
          /** 没有内容，不渲染 */
          if (!content) return null
          switch (message.role) {
            /** 系统提示词，不在 UI 上显示，渲染时隐藏 */
            case 'system': {
              return null
            }
            /** 用户的消息 */
            case 'user': {
              return (
                <Bubble
                  key={key}
                  content={<XMarkdown content={content} />}
                  header={<h5>铲屎官</h5>}
                  avatar={
                    <Avatar icon={<SmileOutlined style={{ fontSize: 26 }} />} />
                  }
                  // 人类消息，靠右布局
                  placement={'end'}
                />
              )
            }
            /** 模型的消息 */
            case 'assistant': {
              return (
                <Bubble
                  key={key}
                  content={<XMarkdown content={content} />}
                  header={<h5>立夏猫</h5>}
                  avatar={
                    <Avatar
                      icon={<GithubOutlined style={{ fontSize: 26 }} />}
                    />
                  }
                  // 模型消息，靠左布局
                  placement={'start'}
                />
              )
            }
            /** 商品卡片 */
            case 'card': {
              const card = message.card!

              /** 模拟：请求订单系统接口，保存结果 */
              const buyProduct = async (product: any) => {
                /** 也可以返回：“购买失败“ */
                return `购买成功。订单号：123456。商品 skuId： ${product.skuId}。商品描述：${product.desc}`
              }

              const onComfirm = async () => {
                const content = await buyProduct(card.product)
                /** 保存结果 */
                const toolResult: Message = {
                  id: `${sync.history.length}`,
                  role: 'tool',
                  tool_call_id: card.tool_call_id,
                  content,
                }
                card.disabled = true
                sync.history.push(toolResult)
                /** UI 层回传结果给模型：成功/失败 */
                tryChat()
              }
              return (
                <Bubble
                  key={`${message.id}`}
                  content={content}
                  header={<h5>立夏猫</h5>}
                  footer={
                    <Product
                      {...card.product}
                      key={`${card.disabled}`}
                      onComfirm={onComfirm}
                      disabled={card.disabled}
                    />
                  }
                  avatar={
                    <Avatar
                      icon={<GithubOutlined style={{ fontSize: 26 }} />}
                    />
                  }
                  placement={'start'}
                  styles={{
                    content: {
                      padding: 0,
                      minHeight: 'unset',
                      background: 'unset',
                    },
                    footer: { marginTop: 8 },
                  }}
                />
              )
            }
          }
          return null
        })}
        {sync.waiting ? (
          <Bubble
            loading={true}
            key="waiting"
            content=""
            header={<h5>立夏猫</h5>}
            avatar={
              <Avatar icon={<GithubOutlined style={{ fontSize: 26 }} />} />
            }
            placement={'start'}
          />
        ) : null}
      </div>
      <div className="chat-sender">
        <Sender
          /** 输入框，数据双向绑定 */
          value={input}
          onChange={input => {
            setInput(input)
          }}
          styles={{
            root: { background: 'white' },
          }}
          /** 点击发送按钮 */
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}

export default App
