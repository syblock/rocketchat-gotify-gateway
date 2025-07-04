import { ChangeStreamDocument, Collection } from "mongodb"
import { v4 as uuid } from "uuid"
import { getDb, getNotificationUsers, User } from "./db"
import { createApplicationAndClientForNotification } from "./gotify"

export async function initGotifyForUser(user: User) {
	if (!user) return
	if (user?.initiated) return
	console.log("User:", user)
	const db = await getDb()
	let password = user.gotifyPassword
	let appToken = user.gotifyAppToken
	let clientToken = user.gotifyClientToken
	if (!user.gotifyAppToken) {
		password = uuid()
		const tokens = await createApplicationAndClientForNotification(user.uid.toString("base64"), password)
		if (!tokens) return
		appToken = tokens.app_token
		clientToken = tokens.client_token
		await db.collection("users").updateOne(
			{ _id: user.uid },
			{
				$set: {
					gotifyAppToken: appToken,
					gotifyClientToken: clientToken,
					gotifyPassword: password
				}
			}
		)
	}
	await db.collection("_raix_push_app_tokens").updateOne(
		{ _id: user._id },
		{
			$set: {
				gotifyAppToken: appToken,
				gotifyClientToken: clientToken
			}
		}
	)
}

async function runFunctionOnInsert(doc: any) {
	console.log(`[HOOK] Document inserted id:`, doc.userId)
	let user = (await getNotificationUsers(undefined, doc.token?.gcm))?.[0]
	initGotifyForUser(user)
}

function runFunctionOnDelete(docId: string) {
	console.log(`[HOOK] Document deleted id:`, docId)
}

export async function startNotificationTokenChangeListener() {
	try {
		const db = await getDb()
		const collection: Collection<any> = db.collection("_raix_push_app_tokens")

		const changeStream = collection.watch([{ $match: { operationType: { $in: ["insert", "delete"] } } }])

		console.log("Listening for insert and delete changes on _raix_push_app_tokens...")

		changeStream.on("change", (change: ChangeStreamDocument) => {
			if (change.operationType === "insert") {
				runFunctionOnInsert(change.fullDocument)
			} else if (change.operationType === "delete") {
				runFunctionOnDelete(change.documentKey._id.toString())
			}
		})

		changeStream.on("error", async (error) => {
			console.error("Change Stream encountered an error:", error)
			changeStream.close()
			console.log("Attempting to restart Change Stream in 2 seconds...")
			await new Promise((resolve) => setTimeout(resolve, 2000))
			startNotificationTokenChangeListener()
		})

		changeStream.on("close", async () => {
			console.log("Change Stream closed. Attempting to restart in 2 seconds...")
			await new Promise((resolve) => setTimeout(resolve, 2000))
			startNotificationTokenChangeListener()
		})
	} catch (error) {
		console.error("Error setting up Change Stream:", error)
		console.log("Attempting to retry Change Stream setup in 2 seconds...")
		await new Promise((resolve) => setTimeout(resolve, 2000))
		startNotificationTokenChangeListener()
	}
}
