import React, {useEffect, useState} from 'react'
import {IChartStyles, IWidgetWrapperProps} from '../Widget/components/Widget'
import {loadScript} from 'app/utils/util'
import request from 'app/utils/request'

type THooksEventField = 'mount' | 'update' | 'unmount'
type THooksMount = (data, style?: IChartStyles) => any
type THooksUpdate = (newData, style?: IChartStyles) => any
type THooksUnmount = () => any

interface IHooksEventCallbacks {
  mount: THooksMount
  update: THooksUpdate
  unmount: THooksUnmount
}

type TPluginRenderFunc = (hook: CustomPluginHooks, id: string, host?: any) => any

const style = {
  width: '100%',
  height: '100%',
  border: 'none'
}

export class CustomPluginHooks {
  public events: IHooksEventCallbacks

  constructor() {
    this.events = {
      mount: null,
      update: null,
      unmount: null
    }
  }

  public on(event: THooksEventField, callback: IHooksEventCallbacks) {
    this.events[event] = callback as any
  }

  public off(event: THooksEventField) {
    this.events[event] = null
  }

  public clear() {
    this.events = {
      mount: null,
      update: null,
      unmount: null
    }
  }
}


const hooks = new CustomPluginHooks()
const CUSTOM_PLUGIN_CONTAINER_ID = '_customPluginContainer'
/**
 * Custom Chart Component
 * @param props
 */
const CustomContainer: React.FC<IWidgetWrapperProps> = (props) => {

  const {customModuleSelected, data, onEditCustomPlugin, chartStyles} = props
  const [iframeDocument, setIframeDocument] = useState(null)

  useEffect(() => {
    (async() => {
      if (!iframeDocument) {
        return
      }

      try {
        if (!customModuleSelected.isLoaded) {
          const loadDeps = customModuleSelected.deps.map((url) => loadScript(url))
          await Promise.all(loadDeps)
          onEditCustomPlugin(['modules', customModuleSelected.config.chartInfo.name], 'isLoaded', true)
        }
        let renderFunc: TPluginRenderFunc | string = customModuleSelected.render
        if (typeof renderFunc === 'string') {
          renderFunc = await loadRenderFunc(renderFunc)
          onEditCustomPlugin(['modules', customModuleSelected.config.chartInfo.name], 'render', renderFunc)
        }

        renderFunc(hooks, CUSTOM_PLUGIN_CONTAINER_ID, iframeDocument)
      } catch (error) {
        console.error('plugin render: ' + error)
      }
      try {
        hooks.events?.mount?.(data, chartStyles)
      } catch (error) {
        console.error('plugin mount: ' + error)
      }
    })()
    return () => {
      try {
        hooks.events?.unmount?.()
        hooks.clear()
      } catch (error) {
        console.error('plugin unmount: ' + error)
      }
    }
  }, [iframeDocument])

  useEffect(() => {
    const {data} = props
    try {
      console.log('enter ---> data changed ', data)
      hooks.events?.update?.(data, chartStyles)
    } catch (error) {
      console.error('plugin update: ' + error)
    }
  }, [data])

  const onLoaded = () => {
    const host = (document.getElementById('custom-iframe') as HTMLIFrameElement).contentWindow?.document?.getElementById(CUSTOM_PLUGIN_CONTAINER_ID)
    setIframeDocument(host)
  }

  return <iframe id="custom-iframe" src="3rd/plugins/iframe-container.html" style={style} allowFullScreen onLoad={onLoaded}/>
}

const loadRenderFunc = (url: string) => {
  return new Promise<TPluginRenderFunc>((resolve, reject) => {
    request(url).then((fnStr) => {
      // tslint:disable-next-line:no-eval
      const renderFunc: TPluginRenderFunc = eval(`(${fnStr})`)
      resolve(renderFunc)
    })
  })
}

export default CustomContainer
