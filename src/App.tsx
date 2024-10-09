import { useState } from 'react'
import './App.css'
import WebGPUCanvas from './components/WebGPUCanvas'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <WebGPUCanvas/>
      </div>
    </>
  )
}

export default App
