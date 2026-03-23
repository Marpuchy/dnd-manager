# DND Manager

A web-based platform for managing Dungeons & Dragons 5e campaigns, characters, and compendium content in a structured and scalable way.

---

## Overview

DND Manager is a full-stack web application designed to centralize tabletop RPG workflows into a single platform.

The project focuses on three main areas:

- **Character management** through a guided creation flow
- **Campaign organization** with DM and player roles
- **Compendium management** for SRD-based content such as spells, items, creatures, rules, and related data

Beyond its functional goal, the project is also an exploration of **clean architecture, modular system design, and scalable data modeling** for complex interactive applications.

---

## Core Features

- Guided character creation flow
- Campaign management with role-based participation (DM / Player)
- Session organization and campaign notes
- Structured compendium system for spells, items, feats, monsters, NPCs, races, classes, subclasses, backgrounds, conditions, and rules
- English / Spanish localization support
- Asset management for portraits, maps, handouts, and notes
- Change history foundation for tracked entity updates
- Export-oriented workflow prepared for character sheet generation

---

## Tech Stack

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Prisma**
- **Supabase**
- **Vitest**
- **Playwright**

---

## Architecture & Technical Approach

DND Manager is being developed as a modular system rather than a collection of isolated pages.

### Modular domain design
The application is structured around clear domains such as:

- campaigns
- characters
- compendium
- notes
- assets
- history

This makes the project easier to extend as more gameplay and management systems are added.

### Scalable data model
The database schema is designed to support both personal and campaign-based content, with relationships for:

- users and memberships
- campaign sessions
- characters and stats
- items and spells
- compendium entries and translations
- notes and uploaded assets
- entity history tracking

### Maintainability first
The project is built with maintainability in mind:
- typed frontend and backend flow
- clear entity boundaries
- reusable structures for future expansion
- test tooling already integrated into the project

### Product-oriented UX
The interface is intended to feel practical and campaign-ready, balancing usability for players and DMs with a structured and professional presentation.

---

## Current Product Direction

DND Manager is being shaped as a professional campaign workspace for D&D 5e, where players and Dungeon Masters can manage their game data in one place.

Current product direction includes:

- campaign dashboard workflows
- guided character creation
- multilingual compendium access
- structured notes and session content
- editable and persistent campaign resources

---

## Project Structure

```bash
dnd-manager/
├── prisma/
├── public/
├── scripts/
├── src/
│   └── app/
├── package.json
└── tsconfig.json
