import { Button, Flex } from 'antd'
import * as React from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'

function Component() {
  const [state, setState] = React.useState('')
  const ref = React.useRef({
    content: '',
  })
  const [, setValue] = React.useState(1)
  const forceUpdate = () => setValue(previous => previous + 1) // 值是什么不重要，在变就行

  React.useEffect(() => {
    if (!state) return
    console.log('render: ' + state)
  }, [state])

  const onAdd = () => {
    console.log('before setState: ' + state)
    const tokens = ['你好', '👋，', '我是', '立夏猫']
    tokens.forEach(token => {
      ref.current.content += token
      forceUpdate()
    })
    console.log('after  setState: ' + state)
  }

  return (
    <Flex align="center" gap={16} style={{ padding: 16 }}>
      state:{ref.current.content}
      <Button onClick={onAdd}>add</Button>
    </Flex>
  )
}

createRoot(document.getElementById('root')!).render(<Component />)
