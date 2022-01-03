# [Burdy](https://burdy.io)

**2.1 is out! Faster and more flexible then ever.**

<img src="https://github.com/burdy-io/burdy/blob/main/assets/burdy.png?raw=true" alt="headless cms burdy" />

Most advanced Open-source Headless CMS written in Typescript

## Installation

```sh
npx create-burdy-app my-project

cd my-project/
npm run dev
```

Open [http://localhost:4000/admin](http://localhost:4000/admin) to view your running app.
When you're ready for production, run `npm run build` then `npm run start`.

# 2.1 Summary
* **Preview Editor** - Omni-channel configuration from the Admin, for more details visit https://burdy.io/docs/preview-editor
* **Content API** - Enhanced Retrieve Content API, added new SearchPosts and SearchTags API. Enhanced Security.
* **Content Type Fields** - Added 2 new reference fields and deprecated old relations.
* **RichText** - Enhanced RichText field to support custom components
* **Burdy Web and React Utils** - for more details visit https://burdy.io/docs/react-utils and https://burdy.io/docs/web-utils

# 2.0 Summary
## New Features
* **Backup Management** - New way of managing backups of your entire data. Backup, restore, export, import or moving content across environments!
* **Preview Editor** - Besides Headless Editor we have released new Editor based on IFrame. Now you can manage content and preview your updates live on your websites directly from Burdy!
* **Hierarchical Posts** - Besides having Hierarchical Pages we have added support for Hierarchical Posts which represent repeatable data such as Blogs, Docs and more organized in a Sites Hierarchy, for example mainsite/en/blogs/<blog>

## Improvements
* **Improved Authoring Experience** - Managing Multiple sites or mobile apps from single Burdy has never been easier. With optimized **Sites** you can now manage **tens of thousands** of pages and posts in a single Burdy
* **Improved Cloud Provider Support** - Besides native support for AWS infrastructure, we are officially announcing native support for DigitalOcean.
* **Optimized Editors** - Both Headless and Preview Editors are faster then ever.
* **Improved Localization Capability** - With the unified post/page structure, localization is a second nature of our system.

## Migration to 2.1
For migration to take place user will need to run migration scripts, for more details visit https://burdy.io/docs/database under CLI commands section

## Breaking Changes
* Burdy 2.0 is not backwards compatible with Burdy 1.0
* Flat Posts have been replaced with Hierarchical Posts inside **Sites**

## Sneak Peek at upcoming features
* **Publish content across environments** - Deliver your selected content across multiple Burdy systems (from one environment to another), with a few simple clicks.
* **Redis Support** - We aim to improve content delivery performance by providing native Redis support. You can expect Burdy to be able to serve thousands of requests per second on content API.
* **A/B Testing** - A/B test any post, page, fragment

---

# Burdy Features
Out of the box Burdy comes with many features

* **Any Data Structure** - build and manage any data structure, objects, arrays, arrays in objects, arrays in arrays in objects, arrays in object in arrays or what ever you whish!
* **Digital Assets Management** - inspired by **OneDrive** and **Operating systems**, it gives simplicity and organization capabilities,
* **Content types** - **16 fields types** out of the box, and you can **easily extend** it with your custom,
* **Post versioning** - every update will create a version that authors will be able to restore,
* **Sites hierarchy** - authors will be able to organize pages, posts, fragments and multiple websites in a folder like structure,
* **Tags** - tag pages, posts or assets with ease
* **Users management** with Groups and Permissions access control

### Field types

19 Out of the box field types. Learn how to extend with your custom by visiting [Custom Editor Fields](https://burdy.io/docs/custom-editor-field/) docs.

Core:
- Text
- Rich Text (enhanced with custom components)
- Ace Editor (json, js, ts, html...)
- Number
- Checkbox
- Choice group
- Assets
- Images
- Dropdown
- Color Picker
- Date Picker
- Relation (deprecated)
- Reference Single (new)
- Reference Multiple (new)
- Custom Component

Layout:
- Group
- Repeatable
- Tab
- Dynamic Zone

## Tech Stack

* Self-hosted - know where your data is stored!
* Backend - Node.js, TypeORM, Express
* Admin - React, Fluent UI
* Databases - TypeORM (SQLite, Postgres, MySQL, MariaDB), File Storage - file system, AWS S3, DigitalOcean Spaces
* Customizable - You are able to extend any part of Admin or Backend by just using hooks. Furthermore, you can create custom functionalities in a no time!
* Native Cloud Support - AWS, DigitalOcean

For more details visit our [Docs](https://burdy.io/docs)

Enjoy!!!
