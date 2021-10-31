import {
  Wechaty,
  type,
  log,
  WechatyPlugin,
}                 from 'wechaty'

import {
  matchers,
  talkers,
}                         from 'wechaty-plugin-contrib'

import type {
  Bot5AssistantConfig,
}                         from './config.js'

import { processMessage } from './bot5-qingyu.js'

const dongOptions: talkers.MessageTalkerOptions = [
  'dong {{ inMeeting }}',
]

export function Bot5Assistant (config: Bot5AssistantConfig): WechatyPlugin {
  log.verbose('WechatyPluginContrib', 'Bot5Assistant(%s)', JSON.stringify(config))

  const isMeetingRoom = matchers.roomMatcher(config.room)
  const talkDong      = talkers.messageTalker<{ inMeeting: boolean }>(dongOptions)

  return function Bot5AssistantPlugin (wechaty: Wechaty) {
    log.verbose('WechatyPluginContrib', 'Bot5Assistant() Bot5AssistantPlugin(%s)', wechaty)

    wechaty.on('message', async message => {
      /**
       * Validate Vote Message
       */
      if (message.type() !== type.Message.Text) { return  }

      const room  = message.room()
      if (!room)                                { return  }
      if (!await isMeetingRoom(room))           { return  }

      // const talker = message.talker()
      // const mentionList = await message.mentionList()
      // if (mentionList.length <= 0)              { return }

      const context = {
        inMeeting: false,
      }

      const text = await message.mentionText()
      if (text === 'ding') {
        await talkDong(message, { inMeeting: context.inMeeting })
      }

      return processMessage(context, message)
    })
  }

}
