const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// In-memory store to track successful schema creations
// Replace this with a persistent database in production
let schemaStore = {};

/**
 * Function to generate the payload for schema creation
 * @param {Object} classObj - UML class object
 * @returns {Object} - Payload for the schema API
 */
const generateSchemaPayload = (classObj) => ({
    entityName: classObj.className.toLowerCase(),
    description: classObj.className.toLowerCase(),
    schemaReadAccess: "PUBLIC",
    dataReadAccess: "PUBLIC",
    dataWriteAccess: "PUBLIC",
    metadataReadAccess: "PUBLIC",
    metadataWriteAccess: "PUBLIC",
    universes: ["670d03d53d1891116af086bf"], // Update as needed
    tags: { "BLUE": [] },
    attributes: classObj.attributes.map(attr => ({
        name: attr.name,
        nestedName: attr.name,
        type: { type: attr.type },
        required: attr.required,
        videos: [],
        childAttributes: []
    })),
    primaryKey: [classObj.attributes.find(attr => attr.required).name],
    execute: "PUBLIC",
    visibility: "PUBLIC"
});

app.post('/createSchemas', async (req, res) => {
    const umlClasses = req.body.umlClasses;
    console.log(umlClasses)
    const successData = {}; // To store successfully created schemas
    const errors = {};      // To store any errors encountered

    try {
        // Iterate over each UML class and attempt to create the schema
        const promises = umlClasses.map(async (umlClass) => {
        const schemaName = umlClass.className.toLowerCase();

            // If schema already exists, return its ID
            if (schemaStore[schemaName]) {
                return { name: schemaName, schemaId: schemaStore[schemaName] };
            }

            const schemaPayload = generateSchemaPayload(umlClass);

            try {
                const response = await axios.post(
                    'https://ig.gov-cloud.ai/pi-entity-service/v1.0/schemas',
                    schemaPayload,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI3Ny1NUVdFRTNHZE5adGlsWU5IYmpsa2dVSkpaWUJWVmN1UmFZdHl5ejFjIn0.eyJleHAiOjE3MjYxODIzMzEsImlhdCI6MTcyNjE0NjMzMSwianRpIjoiOGVlZTU1MDctNGVlOC00NjE1LTg3OWUtNTVkMjViMjQ2MGFmIiwiaXNzIjoiaHR0cDovL2tleWNsb2FrLmtleWNsb2FrLnN2Yy5jbHVzdGVyLmxvY2FsOjgwODAvcmVhbG1zL21hc3RlciIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJmNzFmMzU5My1hNjdhLTQwYmMtYTExYS05YTQ0NjY4YjQxMGQiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJIT0xBQ1JBQ1kiLCJzZXNzaW9uX3N0YXRlIjoiYmI1ZjJkMzktYTQ3ZC00MjI0LWFjZGMtZTdmNzQwNDc2OTgwIiwibmFtZSI6ImtzYW14cCBrc2FteHAiLCJnaXZlbl9uYW1lIjoia3NhbXhwIiwiZmFtaWx5X25hbWUiOiJrc2FteHAiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJwYXNzd29yZF90ZW5hbnRfa3NhbXhwQG1vYml1c2R0YWFzLmFpIiwiZW1haWwiOiJwYXNzd29yZF90ZW5hbnRfa3NhbXhwQG1vYml1c2R0YWFzLmFpIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtbWFzdGVyIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7IkhPTEFDUkFDWSI6eyJyb2xlcyI6WyJIT0xBQ1JBQ1lfVVNFUiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwic2lkIjoiYmI1ZjJkMzktYTQ3ZC00MjI0LWFjZGMtZTdmNzQwNDc2OTgwIiwidGVuYW50SWQiOiJmNzFmMzU5My1hNjdhLTQwYmMtYTExYS05YTQ0NjY4YjQxMGQiLCJyZXF1ZXN0ZXJUeXBlIjoiVEVOQU5UIn0=.FXeDyHBhlG9L4_NCeSyHEaNEBVmhFpfSBqlcbhHaPaoydhKcA0BfuyHgxg_32kQk6z5S9IQ7nVKS2ybtOvwo0WyLWwLQchSq7Noa7LooHIMzmeWMQb_bLKtbaOti59zwIdS8CkfGaXut7RUQKISQVWmbUGsVJQa2JkG6Ng_QN0y5hFVksMWPZiXVsofQkJXHXV1CQ3gabhhHKo3BqlJwzpsCKLDfg1-4PmSl1Wqbw03Ef2yolroj5i8FoeHukOQPkwCUHrrNw-ilIp917nqZa89YbCMtDjWyaj8pEH7GJR5vMZPE2WcJPn5dSA1IHVunfatEB1cDAitaFjVNWNnddQ` // Ensure AUTH_TOKEN is set in environment variables
                        }
                    }
                );

                const { schemaId, entitySchema } = response.data;

                // Store the successful schema creation
                schemaStore[entitySchema.name] = schemaId;

                return { name: entitySchema.name, schemaId };

            } catch (error) {
                if (error.response) {
                    if (error.response.status === 409) {
                        // Conflict: Schema already exists
                        if (schemaStore[schemaName]) {
                            return { name: schemaName, schemaId: schemaStore[schemaName] };
                        } else {
                            // If not in store but API indicates conflict, fetch existing schema ID if possible
                            // This part requires an additional API call to retrieve the existing schema ID
                            // Assuming such an endpoint exists:
                            // /*
                            // const existingSchema = await axios.get(`https://ig.gov-cloud.ai/pi-entity-service/v1.0/schemas/${schemaName}`, {
                            //     headers: {
                            //         'Authorization': `Bearer ${process.env.AUTH_TOKEN}`
                            //     }
                            // });
                            // schemaStore[schemaName] = existingSchema.data.schemaId;
                            // return { name: schemaName, schemaId: existingSchema.data.schemaId };
    
                            // For simplicity, we'll return an error if not in store
                            errors[schemaName] = 'Schema already exists but schema ID not found in store.';
                            return null;
                        }
                    } else {
                        // Other API errors
                        errors[schemaName] = error.response.data.message || 'Error creating schema.';
                        return null;
                    }
                } else {
                    // Network or other errors
                    errors[schemaName] = error.message || 'Unknown error.';
                    return null;
                }
            }
        });

        const results = await Promise.all(promises);

        // Populate successData with successful schema creations
        results.forEach(result => {
            if (result && result.name && result.schemaId) {
                successData[result.name] = result.schemaId;
            }
        });

        // Determine the appropriate response status
        if (Object.keys(errors).length > 0) {
            // If there are any errors, respond with 207 Multi-Status
            res.status(207).json({
                successData,
                errors
            });
        } else {
            // All schemas created successfully
            res.status(200).json(successData);
        }

    } catch (error) {
        // Handle unexpected errors
        res.status(500).json({
            message: 'An unexpected error occurred.',
            error: error.message || 'Unknown error.'
        });
    }
});

// Start the server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
