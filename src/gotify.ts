import { $fetch } from "ofetch"
import { v4 as uuid } from "uuid"

const BASE_URL = `http://localhost:${process.env.GOTIFY_PORT}`

export const createGotifyUser = async (name: string, pass: string) => {
	try {
		const r = await $fetch(BASE_URL + "/user", {
			method: "POST",
			headers: {
				Authorization:
					"Basic " +
					Buffer.from(`${process.env.GOTIFY_ADMIN_USERNAME}:${process.env.GOTIFY_ADMIN_PASSWORD}`).toString(
						"base64"
					)
			},
			body: {
				admin: false,
				name,
				pass
			}
		})
		console.log("Gotify user created id:", r.id)
		return r
	} catch (e) {
		let message = ""
		try {
			message = e.response?._data?.errorDescription
		} catch (_e) {}
		console.error("Gotify:", message || e)
		return null
	}
}

export const createGotifyApplication = async (
	username: string,
	password: string,
	name: string,
	description: string
) => {
	try {
		const r = await $fetch(BASE_URL + "/application", {
			method: "POST",
			headers: {
				Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64")
			},
			body: {
				name,
				description
			}
		})
		console.log("Gotify application created id:", r.id)
		return r as {
			id: number
			token: string
			name: string
			description: string
			internal: boolean
			image: string
			defaultPriority: number
		}
	} catch (e) {
		let message = ""
		try {
			message = e.response?._data?.errorDescription
		} catch (_e) {}
		console.error("Gotify:", message || e)
		return null
	}
}

export const createGotifyClient = async (username: string, password: string, name: string) => {
	try {
		const r = await $fetch(BASE_URL + "/client", {
			method: "POST",
			headers: {
				Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64")
			},
			body: {
				name
			}
		})
		console.log("Gotify client created id:", r.id)
		return r as {
			id: number
			lastUsed: string
			name: string
			token: string
		}
	} catch (e) {
		let message = ""
		try {
			message = e.response?._data?.errorDescription
		} catch (_e) {}
		console.error("Gotify:", message || e)
		return null
	}
}

export const createApplicationAndClientForNotification = async (username: string, password: string) => {
	const user = await createGotifyUser(username, password)
	if (!user) return null
	const application = await createGotifyApplication(username, password, uuid(), "rocketchat-gotify-gateway")
	if (!application) return null
	const client = await createGotifyClient(username, password, "rocketchat-client")
	if (!client) return null
	return {
		app_token: application.token,
		client_token: client.token
	}
}

export const sendGotifyNotification = async (appToken: string, title: string, message: string) => {
	try {
		const r = await $fetch(BASE_URL + "/message", {
			method: "POST",
			headers: {
				"X-Gotify-Key": appToken
			},
			body: {
				title,
				message
			}
		})
		console.log("Gotify message sent:", r)
		return r as {
			id: number
			appid: number
			message: string
			title: string
			priority: number
			date: string
		}
	} catch (e) {
		let message = ""
		try {
			message = e.response?._data?.errorDescription
		} catch (_e) {}
		console.error("Gotify:", message || e)
		return null
	}
}
