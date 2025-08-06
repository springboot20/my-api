import { google } from "googleapis";
import nodemailer from "nodemailer";
import { __dirname } from "../utils/index.js";
import * as fs from "fs";
import path from "path";

const OAuth2 = google.auth.OAuth2;

/**
 * Replace {{placeholders}} in the HTML template with actual values
 */
function injectTemplateData(template, data) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => data[key] || "");
}

function isTokenExpired(token) {
  let currentTimestamp = Math.floor(Date.now() / 1000);
  return currentTimestamp >= token.expiry_date;
}

async function refreshAccessToken(auth) {
  try {
    const { credentials } = await auth.refreshToken(auth.credentials.refresh_token);
    auth.setCredentials(credentials);

    return credentials.access_token;
  } catch (error) {
    console.log(`Error occurred while refreshing access token: ${error}`);
    throw error;
  }
}

export const createTransporter = async () => {
  const OAuth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  OAuth2Client.setCredentials({
    access_token: process.env.ACCESS_TOKEN,
    refresh_token: process.env.REFRESH_TOKEN,
    token_type: "Bearer",
    expiry_date: process.env.EXPIRY_DATE,
  });

  if (isTokenExpired(OAuth2Client.credentials)) {
    try {
      let refreshedAccessToken = await refreshAccessToken(OAuth2Client);

      OAuth2Client.setCredentials({
        access_token: refreshedAccessToken,
        refresh_token: process.env.REFRESH_TOKEN,
        token_type: "Bearer",
        expiry_date: OAuth2Client.credentials.expiry_date,
      });
    } catch (error) {
      console.error("Failed to refresh access token");
      return null;
    }
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: OAuth2Client.credentials.access_token,
    },
    tls: {
      rejectUnauthorized: false, // This line bypasses SSL certificate verification
    },
  });
};

/**
 *
 * @param {{ to: string, subject: string, templateName: string, data: any }} emailOptions
 * @returns
 */
const sendMail = async (emailOptions) => {
  try {
    const { to, subject, templateName, data } = emailOptions;

    const transporter = await createTransporter();
    if (!transporter) {
      console.error("Failed to create transporter");
      return;
    }

    const templatePath = path.resolve(__dirname, `../service/emails/${templateName}.html`);
    const rawHtml = fs.readFileSync(templatePath, "utf8");
    const finalHtml = injectTemplateData(rawHtml, data);

    const options = {
      from: process.env.EMAIL,
      to,
      subject,
      html: finalHtml,
    };

    const info = await transporter.sendMail(options);
    console.log("Message Id: %s", info.messageId);
  } catch (error) {
    console.log(`Error sending email: ${error.message}`);
  }
};

export { sendMail };
