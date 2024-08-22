const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const sendResponse = require("./utils/sendResponse");
const jwt = require("jsonwebtoken");
const upload = require("./utils/uploader");
require("dotenv").config();
const port = process.env.PORT || 5000;
const cloudinary = require("cloudinary").v2;
const sharp = require("sharp");

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5000",
      "http://localhost:5173",
      "http://localhost:3000",
      "https://devemdad.netlify.app",
      "https://devemdad-dashboard.vercel.app",
    ],
    credentials: true,
  })
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// DB url setting and connection
const uri = `mongodb+srv://${process.env.BD_USER}:${process.env.DB_PASS}@cluster0.eogpx.mongodb.net/?retryWrites=true&w=majority`;
// const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // connect mongodb and create collections
    client.connect();
    const db = client.db("portfolio");
    const collectionUser = db.collection("users");
    const collectionBlog = db.collection("blogs");
    const collectionSkill = db.collection("skills");
    const collectionExperience = db.collection("experience");
    const collectionProject = db.collection("project");

    /*------------------------
        CRUD Method Start  Here
      -----------------------*/

    // Login User
    app.post("/login", async (req, res) => {
      try {
        const userData = await collectionUser.findOne({
          email: req.body?.email,
        });
        console.log(userData?.password, req.body?.password);

        if (!userData) {
          throw new Error("User not found");
        }

        if (req.body?.password !== userData?.password) {
          throw new Error("Incorrect password");
        }

        const payload = {
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        };

        const accessToken = (token = jwt.sign(payload, "0123456789", {
          algorithm: "HS256",
          expiresIn: "1d",
        }));
        console.log(accessToken);

        sendResponse(res, {
          statusCode: 200,
          statusCode: 200,
          success: true,
          message: "User login successfully",
          data: {
            id: userData._id,
            name: userData.name,
            email: userData.email,
            role: userData?.role,
            token: accessToken,
          },
        });
      } catch (error) {
        console.log(error);
        res.send(error?.message);
      }
    });

    /*------------------------
        BLOG Operation Start  Here
      -----------------------*/

    // Create new blog
    app.post("/create-blog", async (req, res) => {
      const result = await collectionBlog.insertOne(req.body);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Blog create successfully",
        data: result,
      });
    });

    // Get all blogs
    app.get("/get-blogs", async (req, res) => {
      const result = await collectionBlog.find({}).sort({ date: -1 }).toArray();

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Blogs retrieve successfully",
        data: result,
      });
    });

    // Get single blog
    app.get("/get-blogs/:id", async (req, res) => {
      const id = req.params.id;
      const result = await collectionBlog.findOne({ _id: ObjectId(id) });

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Blog retrieve successfully",
        data: result,
      });
    });

    // Create new skill
    app.post("/create-skill", async (req, res) => {
      const result = await collectionSkill.insertOne(req.body);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Skill create successfully",
        data: result,
      });
    });

    // Get all skills
    app.get("/get-skills", async (req, res) => {
      const result = await collectionSkill.find({}).toArray();

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Skills retrieve successfully",
        data: result,
      });
    });

    // Create new experience
    app.post("/create-experience", async (req, res) => {
      const result = await collectionExperience.insertOne(req.body);

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Experience create successfully",
        data: result,
      });
    });

    // Get all experiences
    app.get("/get-experiences", async (req, res) => {
      const result = await collectionExperience.find({}).toArray();

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Experiences retrieve successfully",
        data: result,
      });
    });

    // Create new project

    // app.post(
    //   "/create-project",
    //   upload.array("images", 10),
    //   async (req, res) => {
    //     // console.log("Files:", req.files); // Log files received
    //     // console.log("Body:", req.body); //
    //     try {
    //       if (req.files) {
    //         const imageUrls = await Promise.all(
    //           req.files?.map(async (file) => {
    //             const result = await cloudinary.uploader.upload(file.path, {
    //               folder: "portfolio",
    //             });
    //             // console.log(result);
    //             return result.secure_url;
    //           })
    //         );

    //         const {
    //           title,
    //           description,
    //           technologies,
    //           clientLive,
    //           serverLive,
    //           clientCode,
    //           serverCode,
    //           coverUrl,
    //         } = req.body;

    //         const projectData = {
    //           title,
    //           description,
    //           technologies,
    //           clientLive,
    //           clientCode,
    //           serverCode,
    //           serverLive,
    //           imageUrls,
    //           coverUrl,
    //           date: new Date(),
    //         };

    //         const result = await collectionProject.insertOne(projectData);

    //         sendResponse(res, {
    //           statusCode: 200,
    //           success: true,
    //           message: "Project created successfully",
    //           data: result,
    //         });
    //       }
    //     } catch (error) {
    //       console.error(error);
    //       sendResponse(res, {
    //         statusCode: 500,
    //         success: false,
    //         message: "Error creating project",
    //         data: {},
    //       });
    //     }
    //   }
    // );

    app.post(
      "/create-project",
      upload.array("images", 20),
      async (req, res) => {
        try {
          if (req.files) {
            const imageUrls = await Promise.all(
              req.files.map(async (file) => {
                // Get the metadata of the image to check dimensions
                const metadata = await sharp(file.path).metadata();

                // Determine if resizing is necessary
                let resizedBuffer;
                if (metadata.width > 1000 || metadata.height > 1000) {
                  resizedBuffer = await sharp(file.path)
                    .resize({
                      width: metadata.width > 1000 ? 1000 : null,
                      height: metadata.height > 1000 ? 1000 : null,
                      fit: sharp.fit.inside,
                      withoutEnlargement: true,
                    })
                    .toBuffer();
                } else {
                  // If no resizing is needed, read the file directly into a buffer
                  resizedBuffer = await sharp(file.path).toBuffer();
                }

                // Upload the image (resized or original) to Cloudinary
                const result = await new Promise((resolve, reject) => {
                  const stream = cloudinary.uploader.upload_stream(
                    {
                      folder: "portfolio",
                    },
                    (error, result) => {
                      if (error) reject(error);
                      resolve(result);
                    }
                  );

                  // Pipe the buffer into the Cloudinary upload stream
                  stream.end(resizedBuffer);
                });

                return result.secure_url;
              })
            );

            const {
              title,
              description,
              technologies,
              clientLive,
              serverLive,
              clientCode,
              serverCode,
              coverUrl,
            } = req.body;

            const projectData = {
              title,
              description,
              technologies,
              clientLive,
              clientCode,
              serverCode,
              serverLive,
              imageUrls,
              coverUrl,
              date: new Date(),
            };

            const result = await collectionProject.insertOne(projectData);

            sendResponse(res, {
              statusCode: 200,
              success: true,
              message: "Project created successfully",
              data: result,
            });
          }
        } catch (error) {
          console.error(error);
          sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Error creating project",
            data: {},
          });
        }
      }
    );

    // Get all projects
    app.get("/get-projects", async (req, res) => {
      const result = await collectionProject.find({}).toArray();

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Projects retrieve successfully",
        data: result,
      });
    });

    // Get single project
    app.get("/get-projects/:id", async (req, res) => {
      const id = req.params.id;
      const result = await collectionProject.findOne({ _id: ObjectId(id) });

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Project retrieve successfully",
        data: result,
      });
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      stack: err.stack,
    },
  });
});

app.get("/", (req, res) => {
  res.send("Running portfolio Server Online");
});
app.listen(process.env.PORT || port, () => {
  console.log("Running portfolio server, port:", port);
});
