export const sendWelcomeMessage = (req, res) => {
    return res.send("Welcome to the beginner Express API");
};

export const sendHealthStatus = (req, res) => {
    return res.status(200).json({
        message: "Server is running",
        status: "healthy",
    });
};

export const sendAcceptedStatusExample = (req, res) => {
    return res.status(202).json({
        // The message explains why 202 was returned.
        message: "Request accepted for processing",

        // This example shows students that status code and JSON body can work together.
        example: "Production example: report generation request accepted",        
    });
};


// This function sends JSON data.
export const sendUserInfoAsJson = (req, res) => {
  // JSON responses are the most common response type for APIs.
  return res.status(200).json({
    // In real projects this user may come from a database.
    user: {
      // id is a stable identifier for a user.
      id: "user_1001",

      // name is safe public profile data.
      name: "Student User",

      // role is useful for authorization decisions in larger projects.
      role: "student",
    },
  });
};

export const readNameFromQuery = (req, res) => {
  // req.query reads values after ? in the URL, for example /api/search?name=Ariful.
  const name = req.query.name || "Guest";

  // Query params are good for filtering, searching, sorting, and optional values.
  return res.status(200).json({
    // This message shows the query value that came from the URL.
    message: `Hello ${name}, your query parameter was received`,
  });
};

export const readClientInfoHeaders = (req, res) => {
    const clientName = req.get("x-client-name") || "Unknown Client";

    return res.status(200).json({
        clientName,
        note: "Headers are commonly used for metadata, authentication, and client information",
    });
};