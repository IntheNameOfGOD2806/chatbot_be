require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { connectDB } = require("./config/dbConnect.js");
const { upload } = require("./config/cloudinary.js");

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

const { swaggerUi, specs } = require("./config/swagger.js");

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /v1/session:
 *   get:
 *     summary: Initializes a new chat session
 *     responses:
 *       200:
 *         description: Successfully created a new session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session_id:
 *                   type: string
 *                   example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *       500:
 *         description: Server error
 */
app.get('/v1/session', async (req, res) => {
    try {
        const db = await connectDB();
        const session_id = uuidv4();
        await db.collection('sessions').insertOne({
            session_id,
            createdAt: new Date(),
            history: []
        });

        res.json({ session_id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

/**
 * @swagger
 * /v1/sessions:
 *   get:
 *     summary: Retrieve all chat sessions
 *     responses:
 *       200:
 *         description: A list of sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
app.get('/v1/sessions', async (req, res) => {
    try {
        const db = await connectDB();
        const sessions = await db.collection('sessions').find().sort({ createdAt: -1 }).toArray();
        res.json({ sessions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve sessions' });
    }
});

/**
 * @swagger
 * /v1/chat:
 *   post:
 *     summary: Send a message to the chatbot
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session_id
 *               - messages
 *             properties:
 *               session_id:
 *                 type: string
 *                 example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     content:
 *                       type: string
 *                       example: "hello"
 *     responses:
 *       200:
 *         description: Chatbot response
 *       500:
 *         description: Server error
 */
app.post('/v1/chat', async (req, res) => {
    try {
        const { session_id, messages } = req.body;
        const db = await connectDB();

        const answer = "Chào bạn! Đây là phản hồi từ Mock API. Bạn vừa nhắn: " +
            (messages && messages.length > 0 ? messages[messages.length - 1].content : "...");

        if (session_id && messages) {
            await db.collection('sessions').updateOne(
                { session_id },
                { $push: { history: { $each: messages.concat([{ role: 'assistant', content: answer }]) } } }
            );
        }

        res.json({ output: { answer } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Chat failed' });
    }
});

/**
 * @swagger
 * /v1/upload:
 *   post:
 *     summary: Upload files to a session
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: Session ID to associate logs with
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *       400:
 *         description: No files uploaded
 *       500:
 *         description: Upload failed
 */
app.post('/v1/upload', upload.array('files'), async (req, res) => {
    try {
        const session_id = req.body.session_id;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded.' });
        }

        const db = await connectDB();
        const fileUrls = files.map(f => f.path);

        if (session_id) {
            await db.collection('sessions').updateOne(
                { session_id },
                { $push: { files: { $each: fileUrls } } }
            );
        }

        res.json({
            success: true,
            data: fileUrls,
            message: 'Uploaded to Cloudinary successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Global error handling
app.use((err, _req, res, next) => {
    console.error(err);
    res.status(500).send("Uh oh! An unexpected error occured.");
});

// start the Express server
app.listen(PORT, async () => {
    try {
        await connectDB();
    } catch (e) {
        console.error("Failed to connect DB initially", e);
    }
    console.log(`Server is running on port: ${PORT}`);
});