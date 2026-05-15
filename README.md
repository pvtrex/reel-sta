# Social Rex - Comprehensive Technical Architecture & Documentation

## 1. Project Overview
**Social Rex** is a secure, cloud-like web platform tailored for couples to privately share and archive their day-to-day moments through photos and videos. 

- **Main Business Goal**: To provide a centralized, highly accessible, and private digital diary and media archive for relationships.
- **Core Functionality**: Authenticated users can view a dual feed of images and videos. Authorized admins can upload new media directly to the cloud.
- **User Workflow**: Users visit the site, view the interactive falling text hero section, and browse feeds. They must log in to upload. Once logged in (if they are on the admin whitelist), they can upload new images or videos.
- **Application Type**: Full-stack Next.js web application.
- **Tech Ecosystem**: Next.js 15 (App Router), React 19, TypeScript, MongoDB (via Mongoose), NextAuth.js, ImageKit (for media processing/storage), Tailwind CSS, and DaisyUI.

---

## 2. High Level Architecture

### Architecture Breakdown
- **Frontend Architecture**: React Server Components (RSC) and Client Components via the Next.js App Router. UI components use Tailwind CSS and DaisyUI for rapid, accessible styling.
- **Backend Architecture**: Next.js Route Handlers (`app/api/*`) act as a serverless API layer connecting directly to MongoDB. 
- **Database Layer**: MongoDB NoSQL database. Mongoose is used as the ODM to define schemas (`User`, `Video`, `Image`, `LoginLog`).
- **Authentication Layer**: Handled by NextAuth.js using the Credentials provider. Security relies on JWT tokens and a hardcoded `ADMIN_WHITELIST`.
- **State Management**: NextAuth manages global authentication state (`useSession`). Local UI state is handled via React's `useState` and `useEffect`.
- **File Upload Architecture**: The system uses **ImageKit**. The client requests an auth signature from `/api/imagekit-auth`, uploads media directly to ImageKit's servers, and then sends the resulting URL and metadata back to the Next.js API to be saved in MongoDB.
- **Deployment Architecture**: Optimized for Vercel/Netlify. The app assumes a serverless environment where API routes execute as serverless functions.

### Architecture Analysis & Tradeoffs
- **Why it works**: Using Next.js for both frontend and backend reduces context switching and simplifies deployment. ImageKit offloads heavy media processing and storage from the serverless functions, bypassing Vercel/Netlify upload limits.
- **Where it may fail**: Connection pooling to MongoDB in a serverless environment can lead to exhausted connections under high load, though `lib/db.ts` attempts to cache the connection.
- **Scalability limitations**: The `ADMIN_WHITELIST` is hardcoded. Scaling to multiple couples/users requires migrating this to the database.

---

## 3. Full Folder Structure Breakdown

```bash
/
├── app/
│   ├── api/             # Next.js Route Handlers (Backend APIs)
│   ├── components/      # Reusable React UI Components
│   ├── fonts/           # Local font assets
│   ├── login/           # Login Page Route
│   ├── register/        # Registration Page Route
│   ├── upload/          # Video Upload Route
│   ├── upload-image/    # Image Upload Route
│   ├── globals.css      # Global Tailwind/CSS definitions
│   ├── layout.tsx       # Root App Layout
│   └── page.tsx         # Home Page
├── lib/                 # Utility functions, DB connection, Auth config
├── models/              # Mongoose DB Schemas
├── public/              # Static public assets (images, icons)
├── scripts/             # Utility scripts (seed.js, mail-test.js)
├── middleware.ts        # Next.js Edge Middleware for Route Protection
├── next.config.ts       # Next.js Configuration
├── package.json         # Project dependencies and scripts
├── tailwind.config.ts   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

### Folder Responsibilities
- **`app/api/`**: The entire backend. Separated by feature (`videos`, `images`, `auth`, `imagekit-auth`). Scalable for serverless deployments.
- **`app/components/`**: UI building blocks. It keeps pages clean. This folder is highly cohesive but could benefit from sub-grouping (e.g., `ui`, `forms`, `layout`).
- **`lib/`**: Core configuration and singletons (Database connection cache, ApiClient, ImageKit config).
- **`models/`**: Defines the data shape. Essential for maintaining data integrity before hitting MongoDB.

---

## 4. File-by-File Breakdown

### `middleware.ts`
- **Purpose**: Protects routes at the Edge before they hit the server.
- **Responsibilities**: Checks NextAuth JWT tokens to allow or reject access.
- **Logic**: Public routes (`/login`, `/register`, `/api/auth`) bypass checks. Admin routes (`/api/reels`, `/api/media`, `/admin`, `/api/videos`, `/api/images`) require `token.role === "admin"`.
- **Security Concerns**: Relying purely on middleware is good, but API routes must also verify roles independently (Defense in Depth).

### `app/page.tsx`
- **Purpose**: Main landing page.
- **Responsibilities**: Fetches video and image feeds and renders the `FallingText` hero section.
- **Data flow**: Uses `useEffect` to fetch data via `apiClient`. Renders `AniLoader` while fetching, then maps data to `VideoFeed` and `ImageFeed`.
- **Performance**: Fetches data client-side. Could be optimized by making this a Server Component and passing data as props to reduce initial load times.

### `models/User.ts`
- **Purpose**: Mongoose schema for User accounts.
- **Logic**: Hashes passwords using `bcryptjs` in a `pre("save")` hook.
- **Security**: Ensures passwords are never saved in plain text.

### `models/Video.ts` & `models/Image.ts`
- **Purpose**: Stores metadata and ImageKit URLs for media.
- **Fields**: `title`, `description`, `videoUrl`/`imageUrl`, `optimizedUrl`.
- **Scalability**: Simple and effective, but lacks fields like `uploadedBy` for multi-tenant tracking.

### `lib/db.ts`
- **Purpose**: Manages MongoDB connections.
- **Logic**: Implements connection caching attached to `global.mongoose` to prevent connection exhaustion in serverless environments.

### `lib/auth.ts`
- **Purpose**: NextAuth configuration.
- **Logic**: Implements `CredentialsProvider`. Validates against MongoDB. Logs success/failure to `LoginLog` model. Injects `ADMIN_WHITELIST`.
- **Security**: Assigns the `admin` role *only* if the email matches the hardcoded whitelist.

### `lib/api-client.ts`
- **Purpose**: Centralized fetch wrapper for frontend components.
- **Responsibilities**: Standardizes API calls (`getVideos`, `createVideo`, etc.) and handles error throwing.

---

## 5. Dependency Analysis

### Key Dependencies
- **`next` (^15.5.15)**: The core framework for React SSR, routing, and APIs.
- **`react` & `react-dom` (^19.0.0)**: Modern UI rendering.
- **`next-auth` (^4.24.11)**: Provides robust, secure JWT-based authentication.
- **`mongoose` (^8.8.4)**: Simplifies MongoDB interactions and adds schema validation.
- **`bcryptjs` (^2.4.3)**: Native JS bcrypt for password hashing (avoids C++ build issues in serverless).
- **`imagekit` & `imagekitio-next`**: Handles media processing, storage, signed URL generation, and optimized media delivery. Greatly improves media load performance.
- **`matter-js` (^0.20.0)**: A 2D physics engine used for the `FallingText` landing page animation.
- **`daisyui` (^4.12.20)**: Tailwind component library. Reduces custom CSS overhead.
- **`tailwindcss` (^3.4.1)**: Utility-first CSS.

### Unused/Questionable Dependencies
- **`ffmpeg`, `fluent-ffmpeg`**: Included in `package.json` but serverless environments rarely have native FFmpeg binaries installed. If used for video processing, this will likely fail in production on Vercel. ImageKit makes this redundant.
- **`razorpay`**: Exists in dependencies but is completely unused in the current architecture. Should be removed to reduce bundle size and security surface.
- **`styled-components`**: Installed alongside Tailwind. Mixing CSS-in-JS with Tailwind creates technical debt and bundle bloat.

---

## 6. Component Deep Dive

### `app/components/FallingText.tsx`
- **Purpose**: Creates an interactive, physics-based text animation for the hero section.
- **Hooks used**: `useRef`, `useState`, `useEffect`, `useCallback`.
- **Logic**: Integrates `matter.js`. Breaks the paragraph into word bodies, applies gravity, and detects boundary collisions. Uses `IntersectionObserver` to trigger animation.
- **Performance**: Physics engines are heavy. Initializing `Matter.Engine` and DOM manipulation heavily taxes the main thread. It should be disabled on low-end devices or if `prefers-reduced-motion` is active.
- **Bugs**: Modifying DOM directly (setting absolute positioning on spans) while React is tracking them can cause hydration mismatches or crash React 19's virtual DOM reconciliation.

### `app/components/Header.tsx`
- **Purpose**: Top navigation bar.
- **State**: Uses `useSession` from NextAuth.
- **Logic**: Displays user email and conditional admin links (`/upload`, `/upload-image`) if logged in. Includes a `signOut` button.
- **Styling**: Sticky header using Tailwind and DaisyUI dropdowns.

### `app/components/VideoComponent.tsx` & `ImageComponent.tsx`
- **Purpose**: Renders individual media items in the feed.
- **Logic**: Conditionally renders standard `<video>`/`<img>` tags for HTTP links, or `<IKVideo>`/`<IKImage>` for ImageKit paths.
- **Performance**: `IKImage` passes transformation parameters (`height: 1920`, `width: 1080`) to optimize payload size on the fly.

---

## 7. API Flow Documentation

### `/api/videos` & `/api/images`
- **GET Flow**:
  1. Validates Session (`getServerSession`).
  2. Connects to MongoDB.
  3. Fetches documents sorted by `createdAt`.
  4. Generates signed URLs via `imagekit.url()` for secure, expiring access (1 hour).
  5. Returns JSON to the client.
- **POST Flow**:
  1. Validates Session AND verifies `session.user.role === "admin"`.
  2. Parses JSON body.
  3. Validates required fields (`title`, `description`, `url`).
  4. Saves to MongoDB.

### `/api/imagekit-auth`
- **GET Flow**: Returns `token`, `expire`, and `signature` using ImageKit SDK. Required by the frontend to upload files directly to ImageKit.

---

## 8. Database Architecture
- **Type**: MongoDB (Document-oriented NoSQL).
- **Models**:
  - `User`: Handles auth. Enforces `unique` email.
  - `Video` / `Image`: Stores media metadata. Includes timestamps.
  - `LoginLog`: Audit trail for login attempts. Captures `email`, `ipAddress`, `userAgent`, and `status`.
- **Query Patterns**: Simple `find({})` with sorts. No complex aggregations are present.
- **Scalability**: Mongoose schema is well-structured. However, lacking indexes on `createdAt` in `Video`/`Image` models will cause slow queries as the collection grows.

---

## 9. Authentication & Authorization
- **Flow**:
  1. User submits form at `/login`.
  2. NextAuth `CredentialsProvider` executes `authorize()`.
  3. Database is queried. Password compared via `bcryptjs`.
  4. **Authorization Check**: Email is checked against `ADMIN_WHITELIST`. Only users in this array are granted the `admin` role.
  5. JWT is created with `role` and `id`. Session callback attaches these to the client session.
- **Security Risks**: The `NEXTAUTH_SECRET` must be strong. JWT tokens mean revocation is difficult until the 1-hour expiry.

---

## 10. State Management Analysis
- **Global State**: NextAuth `SessionProvider` wraps the app in `Providers.tsx`.
- **Server State**: Currently fetched via `useEffect` in Client Components. 
- **Recommendation**: Transition data fetching to Next.js Server Components. Next.js natively caches fetch requests, eliminating the need for `useState` arrays and loading spinners for initial data.

---

## 11. Styling System Analysis
- **System**: Tailwind CSS + DaisyUI.
- **Architecture**: `globals.css` imports Tailwind directives. DaisyUI themes handle color palettes.
- **Performance Impact**: Tailwind purges unused CSS, leading to a tiny CSS bundle. However, the presence of `styled-components` in `package.json` suggests mixed patterns.

---

## 12. Environment Variables Documentation

```env
MONGODB_URI= # Connection string for MongoDB instance. Critical security secret.
NEXTAUTH_SECRET= # Cryptographic key for signing JWTs. Must be a 32+ char random string.
NEXT_PUBLIC_PUBLIC_KEY= # ImageKit public identifier. Safe to expose.
IMAGEKIT_PRIVATE_KEY= # ImageKit secret API key. Never expose. Used for signing URLs.
NEXT_PUBLIC_URL_ENDPOINT= # Base URL for ImageKit delivery.
```

---

## 13. Security Audit

### Current Protections
- Passwords hashed via bcrypt.
- JWT session state prevents session hijacking.
- Login auditing logs IP addresses and user agents.
- API endpoints are protected by role-based session checks.
- Edge Middleware adds an outer layer of route protection.
- Media URLs are signed and expire after 1 hour.

### Security Vulnerabilities & Risks
- **Rate Limiting Absence**: The login API and Route Handlers have no rate limiting. The app is highly vulnerable to brute force and DDoS attacks.
- **IP Spoofing**: `(req?.headers as any)?.["x-forwarded-for"]` can be spoofed.
- **Insecure Dependencies**: `nodemailer`, `ffmpeg`, `styled-components` are in dependencies but not actively used or needed in this specific deployment scope.

### Recommendations
- Implement Upstash Redis for rate limiting on `/api/auth` and media POST routes.
- Remove unused dependencies.

---

## 14. Performance Audit

### Current Bottlenecks
- **Client-Side Fetching**: `app/page.tsx` fetches data on the client. Users see a loader before seeing content.
- **Heavy Physics Engine**: `Matter.js` runs on the main thread.
- **Bundle Size**: Unused libraries (Razorpay, etc.) bloat `node_modules` and potentially the build.

### Optimization Suggestions
- Move `getVideos` and `getImages` logic into a React Server Component.
- Pass initial data as props.
- Lazy load the `FallingText` component using `next/dynamic` so the physics engine doesn't block initial page load.

---

## 15. Scalability Analysis
- **Current State**: Suitable for a single couple or small family.
- **Horizontal Scaling**: Highly scalable due to serverless deployment and stateless JWT authentication.
- **Bottlenecks**: MongoDB connection exhaustion. The `ADMIN_WHITELIST` is hardcoded in the codebase, requiring a redeploy to add new admins.

---

## 16. DevOps & Deployment
- **Build Process**: Standard Next.js `npm run build`.
- **Hosting**: Designed for Vercel or Netlify.
- **CI/CD**: Missing GitHub Actions or testing pipelines.
- **Logging**: Custom `LoginLog` in MongoDB is great, but application errors are just `console.error()`. A tool like Sentry is needed.

---

## 17. Developer Experience Analysis
- **Code Quality**: Generally clean and modular. TypeScript is utilized well for interfaces.
- **Maintainability**: Good, though having both `VideoComponent.tsx` and `ImageComponent.tsx` suggests a potential refactor into a generic `MediaCard.tsx`.
- **Refactor Difficulty**: Low. The app is small enough that architectural shifts (like moving to Server Components) are manageable.

---

## 18. Missing Engineering Practices
- **No Automated Testing**: Missing Jest, Vitest, or Playwright for E2E tests.
- **No API Versioning**: Routes are `/api/videos`, not `/api/v1/videos`.
- **No Input Validation Library**: API routes check `if (!body.title)` manually instead of using a robust validator like Zod.
- **No Structured Logging**: Missing Winston or Pino.

---

## 19. Suggested Refactor Plan

### Quick Wins (1-2 Days)
1. **Remove Unused Dependencies**: Uninstall `ffmpeg`, `razorpay`, `styled-components`.
2. **Implement Zod**: Replace manual `if/else` body validations in API routes with Zod schemas.

### Medium Complexity Improvements (1 Week)
1. **Server Components Migration**: Refactor `app/page.tsx` to fetch data server-side and pass it to a client component for rendering.
2. **Dynamic Whitelist**: Move the `ADMIN_WHITELIST` to the database or a configurable environment variable.

### Large Architecture Improvements
1. **Generic Media Architecture**: Merge `Video` and `Image` MongoDB models into a single `Media` model with a `type` field (`'image' | 'video'`). This halves the required API routes and components.

---

## 20. Full Application Flow

### Media View Flow (User Journey)
1. User opens `Social Rex`.
2. Next.js renders `layout.tsx` (loads Providers & Header).
3. `page.tsx` mounts and `useEffect` triggers `apiClient.getVideos()` and `getImages()`.
4. API Routes validate the session via JWT.
5. API queries MongoDB, generates 1-hour signed ImageKit URLs.
6. Frontend receives JSON, updates state, and React re-renders the `VideoFeed` and `ImageFeed`.
7. `FallingText` component dynamically calculates physics bodies and renders animation.

### Admin Media Upload Flow
1. Admin logs in. NextAuth verifies password and checks `ADMIN_WHITELIST`.
2. Admin navigates to `/upload`.
3. Admin selects a file. Frontend requests auth parameters from `/api/imagekit-auth`.
4. Frontend uses ImageKit SDK to upload the raw file directly to ImageKit's CDN.
5. ImageKit responds with the permanent `url` and `fileId`.
6. Frontend sends a `POST` to `/api/videos` with the `title`, `description`, and ImageKit `url`.
7. Backend validates the admin session, saves to MongoDB, and returns success.
8. Admin is redirected to the home feed.