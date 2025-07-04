import { MongoClient, Db, ObjectId } from "mongodb"

const client = new MongoClient(process.env.MONGO_URI || "", {
	retryWrites: true,
	w: "majority"
})

let db: Db | null = null

client.on("close", () => {
	db = null
})

export const connectDB = async () => {
	try {
		await client.connect()
		db = client.db()
		console.log("MongoDB native driver connected successfully!")
	} catch (error) {
		console.error("MongoDB connection error:", error)
		process.exit(1)
	}
}

export const getDb = async (): Promise<Db> => {
	if (!db) {
		await connectDB()
		if (db) return db
		throw new Error("Database not initialized. Call connectDB first.")
	}
	return db
}

export type User = {
	_id: ObjectId
	uid: ObjectId
	uname: string
	authToken: string
	token: string
	gotifyAppToken: string
	gotifyClientToken: string
	gotifyPassword: string
	initiated: boolean
}

export const getNotificationUsers = async (userId?: ObjectId, token?: string) => {
	const db = await getDb()
	const usersCollection = db.collection("users")
	const users = (await usersCollection
		.aggregate([
			{
				$match: userId
					? {
							type: "user",
							active: true,
							_id: userId
					  }
					: {
							type: "user",
							active: true
					  }
			},
			{
				$lookup: {
					from: "_raix_push_app_tokens",
					let: {
						uId: "$_id"
					},
					pipeline: [
						// this is a left outer join
						{
							$match: {
								$expr: {
									$and: [{ $eq: ["$userId", "$$uId"] }, { $eq: ["$enabled", true] }]
								}
							}
						},
						{
							$limit: 1 // we need just one enabled token per user for the gateway to work
						}
					],
					as: "push"
				}
			},
			{
				$match: token
					? {
							"push.token.gcm": token
					  }
					: {
							"push.token.gcm": {
								$exists: true
							}
					  }
			},
			{
				$project: {
					_id: {
						$arrayElemAt: ["$push._id", 0]
					},
					uid: "$_id",
					uname: "$username",
					token: {
						$arrayElemAt: ["$push.token.gcm", 0]
					},
					authToken: {
						$arrayElemAt: ["$push.authToken", 0]
					},
					gotifyUsername: {
						$cond: {
							if: "$gotifyPassword",
							then: "$_id",
							else: null
						}
					},
					gotifyPassword: "$gotifyPassword",
					gotifyAppToken: "$gotifyAppToken",
					gotifyClientToken: "$gotifyClientToken",
					initiated: {
						$cond: {
							if: {
								$arrayElemAt: ["$push.gotifyClientToken", 0]
							},
							then: true,
							else: false
						}
					}
				}
			}
		])
		.toArray()) as User[]
	return users
}

export default client
