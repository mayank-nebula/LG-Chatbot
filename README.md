<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Starting Soon</title>
    <!-- Import Fonts -->
    <link
      href="https://fonts.googleapis.com/css2?family=HK+Grotesk:wght@700&family=Open+Sans:wght@300;400;600&display=swap"
      rel="stylesheet"
    />
    <style>
      /* Reset Styles */
      body,
      p,
      div {
        margin: 0;
        padding: 0;
      }
      body {
        font-family: "Open Sans", Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      table {
        border-collapse: collapse;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      a {
        text-decoration: none;
      }

      /* Hover Effect */
      .button-link:hover {
        opacity: 0.9 !important;
        box-shadow: 0 4px 12px rgba(41, 40, 93, 0.3) !important;
      }

      /* Responsive */
      @media screen and (max-width: 600px) {
        .container {
          width: 100% !important;
          padding: 0 !important;
        }
        .content-padding {
          padding: 40px 20px !important;
        }
        .mobile-header {
          font-size: 24px !important;
          line-height: 32px !important;
        }
      }
    </style>
  </head>
  <body style="background-color: #f4f4f4; margin: 0; padding: 0">
    <table
      role="presentation"
      width="100%"
      border="0"
      cellpadding="0"
      cellspacing="0"
      style="background-color: #f4f4f4; width: 100%"
    >
      <tr>
        <td align="center" style="padding: 40px 10px">
          <!-- Email Card -->
          <table
            role="presentation"
            class="container"
            width="600"
            border="0"
            cellpadding="0"
            cellspacing="0"
            style="
              width: 600px;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
            "
          >
            <!-- Decorative Top Bar (Branding Colors) -->
            <tr>
              <td height="8" style="font-size: 0; line-height: 0">
                <table
                  role="presentation"
                  width="100%"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  height="8"
                >
                  <tr>
                    <td width="33%" style="background-color: #29285d"></td>
                    <td width="33%" style="background-color: #f09033"></td>
                    <td width="33%" style="background-color: #ffc924"></td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td
                class="content-padding"
                align="center"
                style="padding: 60px 40px"
              >
                <!-- Eyebrow Text: Urgency -->
                <p
                  style="
                    margin: 0 0 15px 0;
                    font-family:
                      &quot;HK Grotesk&quot;, Helvetica, Arial, sans-serif;
                    font-weight: 700;
                    font-size: 12px;
                    color: #f09033;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                  "
                >
                  Starting in 15 Minutes
                </p>

                <!-- Event Title -->
                <h1
                  class="mobile-header"
                  style="
                    margin: 0 0 20px 0;
                    font-family:
                      &quot;HK Grotesk&quot;, Helvetica, Arial, sans-serif;
                    font-weight: 700;
                    font-size: 30px;
                    line-height: 38px;
                    color: #29285d;
                  "
                >
                  {{Event Name}}
                </h1>

                <!-- Body Text -->
                <p
                  style="
                    margin: 0 0 40px 0;
                    font-family:
                      &quot;Open Sans&quot;, Helvetica, Arial, sans-serif;
                    font-weight: 300;
                    font-size: 18px;
                    line-height: 28px;
                    color: #221f20;
                    max-width: 480px;
                  "
                >
                  Hi {{Full Name}}, we are almost ready. <br />
                  Grab your beverage of choice and head over to the waiting
                  room. We will be live shortly!
                </p>

                <table
                  role="presentation"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                >
                  <tr>
                    <td
                      align="center"
                      style="border-radius: 50px; background-color: #29285d"
                    >
                      <a
                        href="https://www.youtube.com/watch?v={{videoId}}"
                        class="button-link"
                        target="_blank"
                        style="
                          display: inline-block;
                          padding: 16px 45px;
                          font-family:
                            &quot;HK Grotesk&quot;, Helvetica, Arial, sans-serif;
                          font-weight: 700;
                          font-size: 16px;
                          color: #ffffff;
                          text-decoration: none;
                          border-radius: 50px;
                          border: 1px solid #29285d;
                        "
                      >
                        Join Event
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                align="center"
                style="
                  background-color: #fafafa;
                  padding: 20px;
                  border-top: 1px solid #eeeeee;
                "
              >
                <p
                  style="
                    font-family:
                      &quot;Open Sans&quot;, Helvetica, Arial, sans-serif;
                    font-weight: 300;
                    font-size: 12px;
                    color: #888888;
                    margin: 0;
                  "
                >
                  <strong>Tip:</strong> The YouTube stream will begin
                  automatically when we go live.
                </p>
              </td>
            </tr>
          </table>

          <!-- Bottom Copyright -->
          <table
            role="presentation"
            width="600"
            border="0"
            cellpadding="0"
            cellspacing="0"
            style="width: 600px; margin-top: 20px"
          >
            <tr>
              <td
                align="center"
                style="
                  font-family:
                    &quot;Open Sans&quot;, Helvetica, Arial, sans-serif;
                  font-weight: 300;
                  font-size: 12px;
                  color: #999999;
                "
              >
                &copy; 2024 Let’s Talk Supply Chain
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
