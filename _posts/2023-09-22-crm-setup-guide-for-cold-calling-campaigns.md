---
layout: post
title: "CRM Setup Guide for Cold Calling Campaigns"
date: 2023-09-22
description: "How to set up your CRM for cold calling success. Disposition codes, pipelines, automations, and integrations explained step by step."
target_keyword: "CRM cold calling setup"
categories: [blog]
tags: ["CRM", "cold calling", "setup", "lead management", "automation"]
author: "Televista Team"
og_image: /assets/images/og-image.png
---

## Your CRM Is Either Making You Money or Losing You Leads

A cold calling campaign without a properly configured CRM is like a fishing boat without a net. You're putting in the work, but the leads are slipping through the gaps.

We've onboarded hundreds of clients at [Televista](/services.html) and the CRM situation is almost always one of two extremes: either they have no CRM at all (leads tracked in spreadsheets, notebooks, or — our personal favorite — sticky notes), or they have a CRM so overcomplicated that nobody actually uses it properly.

This guide walks you through setting up a CRM for cold calling that's practical, efficient, and actually gets used. Whether you're using Podio, GoHighLevel, HubSpot, Follow Up Boss, REsimpli, or any other platform, these principles apply.

## Step 1: Define Your Lead Stages

Before touching any software, map out the journey a lead takes from first contact to closed deal. For a typical cold calling campaign, it looks like this:

1. **New Lead** — In the system, hasn't been contacted yet
2. **Attempted Contact** — Called but no answer, left voicemail or no VM
3. **Contacted** — Spoke with the person, conversation happened
4. **Interested** — Expressed some level of interest, needs follow-up
5. **Appointment Set** — Specific meeting/call scheduled with closer or decision-maker
6. **Appointment Completed** — Meeting happened
7. **Negotiating** — Active deal discussion
8. **Won** — Deal closed
9. **Lost** — Deal dead, with a reason why
10. **Dead Lead** — Wrong number, disconnected, deceased, etc.

Keep it simple. Every additional stage adds complexity that slows your callers down and muddies your reporting. If you can't explain your pipeline stages in 30 seconds, you have too many.

## Step 2: Set Up Disposition Codes

Disposition codes are what your callers select after each call to record the outcome. These are different from lead stages — dispositions describe what happened on a specific call, while stages describe where the lead is in the overall pipeline.

**Essential disposition codes:**

| Code | Description |
|------|-------------|
| **No Answer** | Phone rang, no pickup, no voicemail |
| **Voicemail** | Left a voicemail message |
| **Busy/Disconnected** | Line busy or number no longer in service |
| **Wrong Number** | Reached someone who isn't the target contact |
| **Not Interested** | Spoke with contact, they declined |
| **DNC Request** | Contact asked to be placed on do-not-call list |
| **Callback Requested** | Contact asked to be called back at a specific time |
| **Interested - Follow Up** | Contact showed interest, needs nurturing |
| **Appointment Set** | Scheduled a specific meeting time |
| **Already Listed** | Property already on market (real estate specific) |
| **Already Has Coverage** | Happy with current provider (insurance specific) |

**Rules for disposition codes:**

1. **Keep them under 15.** More than that and callers start picking randomly to save time.
2. **Make them mutually exclusive.** Each call outcome should clearly map to one code.
3. **Include a "notes required" flag** for key dispositions. When someone sets an appointment or requests a callback, require a note with details.
4. **Train callers on what each code means.** "Not Interested" and "DNC Request" are different. Misclassifying a DNC request as "Not Interested" is a compliance violation.

## Step 3: Configure Contact Record Fields

Your contact records need enough information to be useful without being overwhelming. Here's the minimum:

**Required fields:**
- First name, last name
- Phone number (primary)
- Phone number (secondary, if available)
- Property address (for real estate campaigns)
- Email (if collected)
- Lead source (which list/campaign they came from)
- Lead stage (from Step 1)
- Last disposition
- Last contact date
- Next callback date/time
- Assigned caller
- Notes (free text)

**Useful optional fields:**
- Estimated property value
- Equity percentage
- Ownership duration
- Motivation level (hot/warm/cold)
- Preferred contact method
- Best time to call
- Spouse/partner name

**Avoid:**
- Creating 50+ custom fields that never get filled out
- Requiring callers to fill in fields they don't have data for
- Duplicating information that's already in notes

## Step 4: Build Your Calling Workflows

A calling workflow defines what happens to a lead at each stage and when. Here's a basic cold calling workflow:

### Initial Outreach Sequence

**Call 1:** Day 1 — Call during prime hours. If no answer, leave voicemail.
**Call 2:** Day 3 — Call at a different time of day. No voicemail.
**Call 3:** Day 7 — Call during prime hours. Leave voicemail if no answer.
**Call 4:** Day 14 — Call at a different time. No voicemail.
**Call 5:** Day 21 — Final attempt. Leave voicemail with "last call" framing.
**Call 6:** Day 30 — One more attempt, then move to long-term nurture.

### After Contact

**If Interested:** Set a callback within 48 hours. Too much delay and the interest cools.
**If Callback Requested:** Call at the exact time they specified. Not five minutes early, not five minutes late. Exactly when they asked.
**If Not Interested:** Move to 90-day re-engagement queue. People's situations change.
**If DNC:** Immediately flag in CRM and ensure all future campaigns exclude this contact.

### Appointment Follow-Up

**Day before appointment:** Send a confirmation text/email
**30 minutes before:** Second reminder
**If no-show:** Call within 1 hour to reschedule
**After appointment:** Update disposition and move to appropriate next stage

## Step 5: Set Up Automations

Every CRM worth using has some automation capability. Here are the automations that save the most time:

### Must-Have Automations

1. **Auto-assign new leads** to callers based on round-robin or territory rules
2. **Auto-schedule callbacks** when a caller selects "Callback Requested" disposition
3. **Auto-send appointment confirmation** via text or email when an appointment is set
4. **Auto-send appointment reminder** 24 hours and 30 minutes before scheduled time
5. **Auto-flag overdue callbacks** so no lead falls through the cracks

### Nice-to-Have Automations

6. **Auto-move to long-term nurture** after X failed contact attempts
7. **Auto-notify the closer/agent** when an appointment is set (with lead details)
8. **Auto-generate daily reports** with key metrics emailed to stakeholders
9. **Auto-tag leads** based on data criteria (high equity, absentee, etc.)
10. **Auto-drip email/text sequence** for interested leads who aren't ready to commit

## Step 6: Integrate Your Dialer

Your CRM and dialer need to talk to each other. The specific integration depends on your tools, but here's what the integration should handle:

- **Click-to-dial** from within the CRM (no manual number entry)
- **Auto-disposition logging** — call outcome syncs back to the CRM record
- **Call recording attachment** — recording linked to the contact for review
- **Callback scheduling** — callbacks set in the dialer sync to the CRM calendar
- **Real-time status updates** — when a caller dispositions a call, the CRM stage updates automatically

Popular dialer-CRM combinations:
- **Mojo + Podio** (common in real estate)
- **PhoneBurner + HubSpot** (common in B2B)
- **Batch Dialer + GoHighLevel** (popular all-in-one setup)
- **ReadyMode + Salesforce** (enterprise)

If your dialer and CRM don't have a native integration, tools like Zapier or Make can bridge the gap. Just make sure the connection is reliable — lost data is worse than manual entry.

## Step 7: Build Your Reports Dashboard

You can't improve what you don't measure. Set up these reports from day one:

### Daily Report
- Total dials
- Total conversations (contact rate)
- Appointments set
- DNC requests
- Callbacks scheduled for tomorrow

### Weekly Report
- Conversion rates by stage (dials to conversations, conversations to appointments)
- Appointments by caller (if multiple callers)
- Lead source performance (which lists are producing)
- Appointment show rate
- Pipeline value

### Monthly Report
- Cost per appointment
- Cost per closed deal
- ROI by campaign
- List depletion rate (how fast you're burning through data)
- Caller performance trends

## Common CRM Mistakes to Avoid

**Overcomplicating the setup.** The best CRM setup is one that callers actually use. If your callers are spending more time filling out fields than making calls, you've gone too far.

**Not cleaning data.** Duplicate records, wrong numbers sitting in call queues, leads stuck in limbo stages — clean your CRM weekly. A monthly cleanup is too infrequent for active campaigns.

**Ignoring the callback queue.** The callback queue is where your warmest leads live. If callbacks are getting missed because they're buried in the CRM, that's an immediate fix.

**No call recording integration.** If you can't listen to what happened on a call, you can't coach, you can't resolve disputes, and you can't improve. Recordings should be one click away from the contact record.

**Setting up automations before testing manually.** Run your workflows manually for the first week. Find the gaps. Then automate. Automating a broken process just breaks things faster.

## How Televista Handles CRM Integration

When clients work with [Televista](/services.html), we integrate directly with their existing CRM. Our callers disposition calls, set appointments, and log notes directly in your system so you see everything in real time.

If you don't have a CRM yet, we'll help you set one up. Most of our clients are up and running with a properly configured CRM within 2-3 days of onboarding.

Your CRM is the backbone of your cold calling operation. Set it up right, keep it clean, and it becomes the single best tool for turning dials into dollars.

Need help configuring your CRM for a cold calling campaign? [Talk to our team](/contact.html) — we've set up hundreds of them.
