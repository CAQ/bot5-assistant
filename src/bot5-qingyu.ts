// Ref: https://stackoverflow.com/questions/45778474/proper-request-with-async-await-in-node-js
import request from 'request'

import {
  log,
  Message,
}             from 'wechaty'

import type { Bot5AssistantContext } from './plugin.js'

async function getBody (path: string) {
  const options = {
    method: 'GET',
    url: 'https://api.rsvp.ai' + path,
  }
  // Return new promise
  return new Promise(function (resolve, reject) {
    // Do async job
    request.get(options, function (err, _resp, body) {
      if (err) {
        reject(err)
      } else {
        resolve(body)
      }
    })
  })
}

const countDown = /【倒计时】([0-9]+)分钟开始！'/
let timer: undefined | ReturnType<typeof setTimeout>

async function processMessage (
  context: Bot5AssistantContext,
  msg: Message,
) {
  log.info('StarterBot', msg.toString())

  if (context.fsm.state.matches('meeting')) {
    if (msg.text() === '开完了') {
      context.fsm.send('FINISH')
      await msg.say('收到，现在 BOT5 Assistant 结束主持会议啦，大家散会！')
    }
  } else {
    if (msg.text() === '开会了') {
      context.fsm.send('START')
      await msg.say('收到，现在 BOT5 Assistant 开始主持会议啦，请大家座好！')
    }
  }

  if (context.fsm.state.matches('idle')) return

  const body = await getBody(encodeURI('/sandbox/chat?botid=1006663&token=rsvpai&uid=' + msg.talker().id + '&q=' + msg.text())) as string
  console.info('### BOT5 Assistant <> RSVP.ai ###\n', body)
  const j = JSON.parse(body)
  if (j['stage']) {
    for (const m of j['stage']) {
      const r = countDown.exec(m['message'])
      if (r) {
        const minutes = parseInt(r[1]!)
        timer = setTimeout(function () {
          msg.say('时间到！请输入“结束计时”继续。').catch(console.error)
        }, minutes * 1000 * 60)
        console.info(timer)
      }
      if (msg.text() === '结束计时') {
        if (timer) { console.info('clear ' + timer); clearTimeout(timer); console.info('after clear ' + timer) }
        timer = undefined
        console.info('计时器清除')
      }
      await msg.say(m['message'])
    }
  }

}

export {
  processMessage,
}
