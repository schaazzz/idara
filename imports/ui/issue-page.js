import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects.js';
import {Issues} from '../api/issues.js';
import './issue-page.html';

Template.issuePage.onRendered(function onRendered() {
});

Template.issuePage.helpers({
    issue() {
        return activeIssue.get() //Issues.findOne({'number': activeIssue.get()});
    }
});

Template.issuePage.events({
});
