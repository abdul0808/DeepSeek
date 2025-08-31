export const maxDuration = 60;
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";


// Initialize OpenAI client with deepseek API key and base URL
const openai = new OpenAI({
        // baseURL: 'https://api.deepseek.com',
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.DEEPSEEK_KEY
});

export async function POST(req){
    try {
        const { userId } = getAuth(req)

        // extract chatID and prompt from the request body
        const { chatId, prompt } = await req.json();

        if(!userId){
            return NextResponse.json({
                success: false,
                message: "User not authenticated",
            });
        }

        // Find the chat document in the database based on userId and chatId
        await connectDB();
        // debug
        // console.log("userId:", userId, "chatId:", chatId);
        
        // const data = await Chat.findOne({ UserId: userId, _id: chatId })
        const data = await Chat.findOne({ userId, _id: chatId })
           
        if (!data) {
            return NextResponse.json({ success: false, error: "Chat not found" });
        }

        // create a user message object 

        const userPrompt = {
            role: "user",
            content: prompt,
            timestamp: Date.now()
        };

        data.messages.push(userPrompt);

        // call the deepseek api to get a chat completion

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            // messages: data.messages,
            // model: "deepseek-chat",
            model: "deepseek/deepseek-chat-v3-0324",
            store: true,
        });

        const message = completion.choices[0].message;
        message.timestamp = Date.now()
        data.messages.push(message);
        data.save();

        return NextResponse.json({success: true, data: message})

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message });
    }
}