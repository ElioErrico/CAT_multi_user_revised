import type { SocketResponse } from 'ccat-api'

/**
 * The base interface for all message types.
 * It defines the structure of a basic message.
 * The purpose of this type is to be extended by other message types.
 */
export interface MessageBase {
	readonly id: string
	readonly when: Date
	text: string
}

/**
 * An interface for messages sent by the bot.
 */
export interface BotMessage extends MessageBase {
	readonly sender: 'bot'
	why: Required<SocketResponse['why']>
}

/**
 * An interface for messages sent by the user.
 */
export interface UserMessage extends MessageBase {
	readonly sender: 'user'
	readonly file?: File
}

/**
 * The union type for all message types.
 */
export type Message = BotMessage | UserMessage
