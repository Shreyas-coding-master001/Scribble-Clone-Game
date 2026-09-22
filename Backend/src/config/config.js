import dotenv from "dotenv/config";

if(!process.env.frontend_URL) console.log("Frontend_URL is not Present in Envrinment Variable");
if(!process.env.PORT) console.log("PORT is not Present in Envrinment Variable");

const config = {
    frontend_url : process.env.frontend_URL,
    port : process.env.PORT
}

export default config;
