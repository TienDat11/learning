// src/00-bootstrap.js — baseline containers for the bundle. Content files (see CONTRACT.md)
// push into or replace these. Keep the `X = X || …` guard pattern so later files can
// re-declare safely. LOGIC is intentionally NOT declared here: build.mjs reports it as
// missing until src/05-logic.js lands.
var QUESTIONS = QUESTIONS || [];
var QUIZ = QUIZ || [];
var MOCK_SETS = MOCK_SETS || {};
var STUDY_PLANS = STUDY_PLANS || {};
var CASE_STUDY = CASE_STUDY || { title: '', pitch: '', sections: [] };
var SOURCES = SOURCES || [];
var GROUP_INTROS = GROUP_INTROS || {};
var SOURCE_CHECKED = SOURCE_CHECKED || '';
var FLOW_SVGS = FLOW_SVGS || [];
var LESSONS = LESSONS || [];
