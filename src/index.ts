import { Elysia, t } from "elysia"
import DbClient, { connectDB, getDb, getNotificationUsers } from "./db"
import { sendGotifyNotification } from "./gotify"
import { initGotifyForUser, startNotificationTokenChangeListener } from "./notification"

const PORT = process.env.GATEWAY_PORT || 3000

const app = new Elysia()

app.on("start", async () => {
	await connectDB()
	await setupGotifyForUsers()
})

const setupGotifyForUsers = async () => {
	const db = await getDb()
	const users = await getNotificationUsers()
	for (const user of users) {
		initGotifyForUser(user)
	}
	return {
		data: users
	}
}

app.get("/test/:appToken", async ({ params }) => {
	sendGotifyNotification(params.appToken, "test", "test")
})

app.post(
	"/push/:service/send",
	async ({ params, body, set }) => {
		const { service } = params
		console.log("New notification received")
		console.debug("Headers:", body)
		console.debug("Body:", body)

		try {
			const payload = body as {
				token: string
				options?: { title: string; text: string }
			}

			const token = payload.token
			const title = payload.options?.title
			const text = payload.options?.text

			if (!token || (!title && !text)) {
				console.error("Invalid payload: missing token, title, or text in options")
				console.debug("Received payload:", body)
				set.status = 400
				return "Bad Request: Missing required fields in payload"
			}

			let user = (await getNotificationUsers(undefined, token))?.[0]

			if (user?.gotifyAppToken) {
				await sendGotifyNotification(user.gotifyAppToken, title || "", text || "")
			}

			console.log(`Forwarded the received notification, tag=${token}`)
			set.status = 200
			return service
		} catch (error) {
			console.error("Unexpected error during notification processing")
			console.error(error)
			console.error("Could not forward the notification")
			console.info("Received payload:", body)
			set.status = 500
			return "Internal Server Error"
		}
	},
	{
		body: t.Object({
			token: t.String(),
			options: t.Optional(
				t.Object({
					title: t.String(),
					text: t.String()
				})
			)
		})
	}
)

process.on("SIGINT", async () => {
	DbClient.close()
	process.exit(0)
})

process.on("SIGTERM", async () => {
	DbClient.close()
	process.exit(0)
})

app.listen(PORT, () => {
	console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`)
	startNotificationTokenChangeListener().catch(console.error)
})
