import mongoose from "mongoose";

export async function withTransaction<T>(
  handler: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();

  try {
    let result!: T;

    await session.withTransaction(async () => {
      result = await handler(session);
    });

    return result;
  } finally {
    await session.endSession();
  }
}