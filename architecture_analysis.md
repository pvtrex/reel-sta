# Social Rex Architecture Analysis

![Social Rex System Architecture Diagram](C:/Users/zhenr/.gemini/antigravity/brain/052b746a-6fd3-4f1e-8992-29211812b453/social_rex_architecture_detailed_1778409274538.png)

Social Rex is a monolithic full-stack Next.js (App Router) application designed for sharing videos and images. It leverages serverless API routes, a managed MongoDB database, and delegates media storage and delivery to ImageKit to ensure high performance and reduce server bandwidth.

## 2. Frontend Architecture (Client Layer)
The frontend is built using React within the Next.js `app` directory framework.
*   **Routing & Pages**:
    *   `app/page.tsx`: The main feed, rendering both `VideoFeed` and `ImageFeed`.
    *   `app/login/page.tsx` & `app/register/page.tsx`: Authentication interfaces.
    *   `app/upload/page.tsx` & `app/upload-image/page.tsx`: Dedicated media upload flows.
*   **Component Structure**: 
    *   Granular components separated by concern: `Header.tsx` for navigation, `VideoComponent`/`ImageComponent` for media rendering.
    *   `FallingText.tsx` and `AniLoader.tsx` handle complex UI interactions and visual feedback.
    *   `FileUpload.tsx` abstracts the ImageKit upload interface.
*   **State & Providers**: 
    *   `app/components/Providers.tsx` wraps the application in `SessionProvider` (NextAuth) and `ImageKitProvider` (ImageKitio context), distributing global state cleanly without prop-drilling.
*   **Data Fetching**: The frontend primarily utilizes a custom utility `lib/api-client.ts` which encapsulates `fetch` logic, JSON parsing, and error handling for interacting with the backend APIs.

## 3. Backend Architecture (Server Layer)
The backend leverages Next.js Serverless Route Handlers (`app/api/*`).
*   **API Routes**:
    *   `/api/videos/route.ts` & `/api/images/route.ts`: Expose GET (list media) and POST (create media record). 
    *   `/api/imagekit-auth/route.ts`: Securely generates and returns authentication signatures for client-side ImageKit uploads.
    *   `/api/auth/register/route.ts`: Handles secure user creation and password hashing.
*   **Authentication & Middleware**:
    *   **NextAuth.js**: Configured in `app/api/auth/[...nextauth]/route.ts` and `lib/auth.ts`, utilizing a credentials provider with JWT sessions.
    *   **Middleware Protection**: `middleware.ts` acts as a global edge-layer guard, ensuring that non-public routes redirect unauthenticated users before hitting the server logic.
*   **Utilities**: `lib/db.ts` ensures a cached, singleton connection to MongoDB, preventing connection exhaustion in serverless environments.

## 4. Database Layer (MongoDB)
Data is modeled using Mongoose with strict schemas.
*   **Collections**:
    *   `User`: Stores `email`, `password` (hashed via bcrypt), and `role`.
    *   `Video` & `Image`: Stores media metadata (`title`, `description`) and the critical `videoUrl`/`imageUrl` pointers.
    *   `LoginLog`: Provides an audit trail for user access.

## 5. Media Flow & External Services
The application utilizes **Direct-to-Cloud Uploads**, an optimal pattern for serverless.
1.  **Auth Request**: `FileUpload.tsx` requests an upload signature from `/api/imagekit-auth`.
2.  **Direct Upload**: The client directly uploads the binary file to **ImageKit** bypassing the Next.js server, preventing Vercel/Netlify payload limits and bandwidth costs.
3.  **Metadata Save**: ImageKit returns a `filePath`/URL. The frontend submits this URL alongside the title and description to `/api/videos` or `/api/images`.
4.  **Delivery**: The frontend uses `IKVideo` and `IKImage` components, which automatically request optimized, correctly-sized webp/mp4 formats from the ImageKit CDN.

## 6. Request Lifecycle (Example: Uploading a Video)
```text
[Frontend User] --> Fills out `VideoUploadForm` and selects file.
       |
       v
[FileUpload Component] --> Fetches auth params from `/api/imagekit-auth`.
       |
       v
[ImageKit Cloud] <-- Uploads file directly. Returns `url` to Client.
       |
       v
[Client `api-client.ts`] --> POST `/api/videos` (Payload: title, description, url).
       |
       v
[NextAuth Middleware] --> Validates JWT session.
       |
       v
[API Route Handler] --> Connects to DB (`lib/db.ts`) -> Saves to `Video` collection.
       |
       v
[Frontend] <-- Success Response -> Redirects to Home -> Fetches new feed.
```

## 7. Dependency Connections
*   **Frontend UI**: `lucide-react` (icons), `styled-components` (legacy styling for loader/icons), `daisyui` (CSS framework).
*   **Media**: `imagekitio-next`
*   **Security**: `bcryptjs` (hashing), `next-auth` (sessions).
*   **Database**: `mongoose`.
