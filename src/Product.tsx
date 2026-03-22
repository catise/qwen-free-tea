import { Button, Drawer, InputNumber, Radio } from 'antd'
import * as React from 'react'

import './Product.css'

export function Product(props: {
  name?: string
  desc?: string
  quantity?: number
  sweetnessId?: number
  sweetness?: { value: number; label: string }[]
  temperatureId?: number
  temperature?: { value: number; label: string }[]
  onComfirm?: () => any
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)

  const onOpen = () => {
    setOpen(true)
  }

  const onClose = () => {
    setOpen(false)
  }

  const onComfirm = () => {
    props.onComfirm?.()
    onClose()
  }

  return (
    <div className="product-card">
      <div className="store-header">
        <div className="store-info">
          <div className="store-logo" /> <span>咖啡</span>
        </div>
        <div className="store-meta">
          4.8分 <span>·</span> 15分钟 <span>·</span>0.1km
        </div>
      </div>

      <h1 className="product-title">
        {props.name}{' '}
        <span style={{ fontSize: 12 }}>
          {props.quantity ? `X ${props.quantity}` : ''}
        </span>
      </h1>

      <p style={{ color: '#b4b4b4' }}>{props.desc}</p>

      <div className="product-image"></div>

      <Button type="primary" onClick={onOpen} disabled={props.disabled}>
        选这个
      </Button>

      <Drawer
        classNames={{ body: 'product-drawer' }}
        styles={{
          header: { display: 'none' },
          section: { borderRadius: '16px 16px 0 0' },
        }}
        placement="bottom"
        size="auto"
        open={open}
        onClose={onClose}
        footer={
          <Button block type="primary" onClick={onComfirm}>
            选好了
          </Button>
        }
      >
        <div className="product-drawer-img"></div>
        <div>
          <h3>数量</h3>
          <InputNumber
            mode="spinner"
            defaultValue={props.quantity}
            style={{ width: 120 }}
          />
        </div>

        <div>
          <h3>温度</h3>
          <Radio.Group
            block
            options={props.temperature}
            defaultValue={props.temperatureId}
            optionType="button"
          />
        </div>

        <div>
          <h3>甜度</h3>
          <Radio.Group
            block
            options={props.sweetness}
            defaultValue={props.sweetnessId}
            optionType="button"
          />
        </div>
      </Drawer>
    </div>
  )
}
