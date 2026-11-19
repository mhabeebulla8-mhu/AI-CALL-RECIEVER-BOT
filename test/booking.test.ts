// ==========================================================================
// Automated Acceptance Tests for Receptionist Booking Flow
// Tests Acceptance Criteria A through F
// ==========================================================================

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { processUserMessage, resetConversation, getSession } from '../src/bot-engine.ts';
import { getAllAppointments, clearDatabase } from '../src/db.ts';
import { store } from '../src/data.ts';

describe('Receptionist Booking State Machine Acceptance Tests', () => {
  beforeEach(async () => {
    resetConversation();
    await clearDatabase();
  });

  // --------------------------------------------------------------------------
  // TEST A: The exact transcript with correct behavior
  // ...confirm -> saved -> "anything else?" -> "no" -> goodbye and call ends
  // --------------------------------------------------------------------------
  it('A: processes the failing transcript correctly and ends call without looping', async () => {
    // 1. User wants to book
    let res = await processUserMessage('I want to book an appointment');
    assert.match(res[0].content, /Which service/i);
    assert.equal(getSession().step, 'service');

    // 2. Duplicate within 4 seconds is dropped
    res = await processUserMessage('I want to book an appointment');
    assert.equal(res.length, 0, 'Duplicate message within 4s must be dropped');

    // 3. User specifies service
    res = await processUserMessage('hair colouring');
    assert.match(res[0].content, /What day were you thinking/i);
    assert.equal(getSession().step, 'datetime');

    // 4. User specifies day
    res = await processUserMessage('tomorrow');
    assert.match(res[0].content, /openings/i);
    assert.equal(getSession().step, 'datetime');

    // 5. User specifies time
    res = await processUserMessage('2:00 p.m.');
    assert.match(res[0].content, /May I have your name/i);
    assert.equal(getSession().step, 'name');

    // 6. User provides name
    res = await processUserMessage('Habib');
    assert.match(res[0].content, /phone number/i);
    assert.equal(getSession().step, 'phone');

    // 7. User provides phone number
    res = await processUserMessage('9876543210');
    assert.match(res[0].content, /Shall I confirm that for you/i);
    assert.match(res[0].content, /Habib/i);
    assert.match(res[0].content, /Hair Coloring/i);
    assert.match(res[0].content, /9876543210/i);
    assert.equal(getSession().step, 'confirm');

    // 8. User confirms
    res = await processUserMessage('yes confirm');
    assert.match(res[0].content, /confirmed/i);
    assert.match(res[0].content, /anything else/i);
    assert.equal(getSession().step, 'done', 'Step must transition to done');
    assert.equal(getSession().pendingBooking, null, 'Pending booking must be cleared');
    assert.equal(getSession().completedBookings.length, 1, 'Booking must be in completedBookings');

    // 9. User says "no" -> MUST end call, NEVER loop back to confirm!
    res = await processUserMessage('no');
    assert.match(res[0].content, /Thank you for calling Glow & Grace Salon\. Have a great day!/i);
    assert.equal(res[0].action?.type, 'end_call');
    assert.doesNotMatch(res[0].content, /confirm/i, 'Must never ask to confirm again');
  });

  // --------------------------------------------------------------------------
  // TEST B: "yes confirm" typed twice quickly creates exactly ONE appointment row
  // --------------------------------------------------------------------------
  it('B: "yes confirm" typed twice quickly creates exactly ONE appointment row (idempotent)', async () => {
    await processUserMessage('I want to book hair colouring');
    await processUserMessage('tomorrow');
    await processUserMessage('2:00 p.m.');
    await processUserMessage('Habib');
    await processUserMessage('9876543210');

    assert.equal(getSession().step, 'confirm');

    const apptsBefore = (await getAllAppointments()).length;

    // Send "yes confirm" first time
    const res1 = await processUserMessage('yes confirm');
    assert.match(res1[0].content, /confirmed/i);

    // Send "yes confirm" second time quickly (e.g. rapid double click / STT duplicate)
    const res2 = await processUserMessage('yes confirm');
    assert.equal(res2.length, 0, 'Duplicate "yes confirm" within 4s dropped by anti-duplicate filter');

    const apptsAfter = (await getAllAppointments()).length;
    assert.equal(apptsAfter - apptsBefore, 1, 'Exactly ONE appointment row must be created');
  });

  // --------------------------------------------------------------------------
  // TEST C: After DONE, saying "yes" or "no" never triggers the confirm question again
  // --------------------------------------------------------------------------
  it('C: after DONE, saying "yes" or "no" never triggers the confirm question again', async () => {
    await processUserMessage('I want to book hair colouring');
    await processUserMessage('tomorrow');
    await processUserMessage('2:00 p.m.');
    await processUserMessage('Habib');
    await processUserMessage('9876543210');
    await processUserMessage('yes confirm');

    assert.equal(getSession().step, 'done');

    // Saying "yes" after done
    const resYes = await processUserMessage('yes');
    assert.doesNotMatch(resYes[0].content, /Shall I confirm/i);
    assert.match(resYes[0].content, /How else/i);

    // Saying "no" after done
    const resNo = await processUserMessage('no');
    assert.doesNotMatch(resNo[0].content, /Shall I confirm/i);
    assert.match(resNo[0].content, /Thank you for calling Glow & Grace Salon/i);
    assert.equal(resNo[0].action?.type, 'end_call');
  });

  // --------------------------------------------------------------------------
  // TEST D: "I want to book an appointment" arriving twice within 2 seconds is processed once
  // --------------------------------------------------------------------------
  it('D: duplicate message arriving within 2 seconds is processed once', async () => {
    const res1 = await processUserMessage('I want to book an appointment');
    assert.equal(res1.length, 1);
    assert.match(res1[0].content, /Which service/i);

    const res2 = await processUserMessage('I want to book an appointment');
    assert.equal(res2.length, 0, 'Duplicate message within 2 seconds must be ignored');
  });

  // --------------------------------------------------------------------------
  // TEST E: A new booking after DONE ("book another") starts at the name step with empty data
  // --------------------------------------------------------------------------
  it('E: a new booking after DONE ("book another") starts at the name step with empty data', async () => {
    await processUserMessage('I want to book hair colouring');
    await processUserMessage('tomorrow');
    await processUserMessage('2:00 p.m.');
    await processUserMessage('Habib');
    await processUserMessage('9876543210');
    await processUserMessage('yes confirm');

    assert.equal(getSession().step, 'done');

    const resAnother = await processUserMessage('book another');
    assert.equal(getSession().step, 'name', 'Must transition to name step');
    assert.deepEqual(getSession().pendingBooking, {}, 'Pending booking must be empty data');
    assert.match(resAnother[0].content, /name/i);
  });

  // --------------------------------------------------------------------------
  // TEST F: Full correct order: book -> service -> date/time -> name -> phone -> read-back -> confirm -> saved -> anything else -> goodbye
  // --------------------------------------------------------------------------
  it('F: full correct order is strictly followed', async () => {
    // 1. book
    let res = await processUserMessage('I want to book');
    assert.equal(getSession().step, 'service');

    // 2. service
    res = await processUserMessage('Facial Treatment');
    assert.equal(getSession().step, 'datetime');

    // 3. date/time
    res = await processUserMessage('tomorrow at 2 pm');
    assert.equal(getSession().step, 'name');

    // 4. name
    res = await processUserMessage('Priya');
    assert.equal(getSession().step, 'phone');

    // 5. phone
    res = await processUserMessage('9876500000');
    assert.equal(getSession().step, 'confirm');

    // 6. read-back (must include name, service, date, time, phone)
    assert.match(res[0].content, /Priya/i);
    assert.match(res[0].content, /Facial Treatment/i);
    assert.match(res[0].content, /2:00 PM/i);
    assert.match(res[0].content, /9876500000/i);

    // 7. confirm
    res = await processUserMessage('yes confirm');
    assert.equal(getSession().step, 'done');
    assert.match(res[0].content, /confirmed/i);
    assert.match(res[0].content, /anything else/i);

    // 8. goodbye
    res = await processUserMessage('no thank you');
    assert.match(res[0].content, /Thank you for calling/i);
    assert.equal(res[0].action?.type, 'end_call');
  });
});
