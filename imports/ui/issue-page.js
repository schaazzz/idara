import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects.js';
import {Issues} from '../api/issues.js';
import './issue-page.html';

Template.issuePage.onRendered(function onRendered() {
});

Template.issuePage.helpers({
    issue() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisIssue.startDate = moment(new Date(thisIssue.createdAt)).format('YYYY-MM-DD');
        return thisIssue;
    }
});

Template.issuePage.events({
});
