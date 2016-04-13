import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects.js';
import {Issues} from '../api/issues.js';
import {Comments} from '../api/comments.js';
import './issue-page.html';

Template.issuePage.onRendered(function onRendered() {
});

Template.issuePage.helpers({
    allStates() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisProject = Projects.findOne({'name': activeProject.get()});

        workflow = [];
        if (thisIssue.stateIndex > 0) {
            workflow = thisProject.workflow;
            workflow = workflow.slice(1, thisIssue.stateIndex + 1);
            console.log(thisIssue.stateIndex);
            console.log(workflow);
            workflow[0].isFirst = true;
        }

        return workflow;
    },
    isNextStateClosed() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisProject = Projects.findOne({'name': activeProject.get()});
        workflow = thisProject.workflow;

        return workflow[thisIssue.stateIndex + 1].state == 'Closed';
    },
    isClosed() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisProject = Projects.findOne({'name': activeProject.get()});
        workflow = thisProject.workflow;

        return workflow[thisIssue.stateIndex].state == 'Closed';
    },
    currentState() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisProject = Projects.findOne({'name': activeProject.get()});
        workflow = thisProject.workflow;

        return workflow[thisIssue.stateIndex];
    },
    nextState() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisProject = Projects.findOne({'name': activeProject.get()});
        workflow = thisProject.workflow;

        return workflow[thisIssue.stateIndex + 1];
    },
    issue() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisIssue.startDate = moment(new Date(thisIssue.createdAt)).format('YYYY-MM-DD');
        return thisIssue;
    },
    comments() {
        return Comments.find({'project': activeProject.get(), 'issue': parseInt(activeIssue.get())});
    },
    blockStateTransition() {
        thisIssue = Issues.findOne({'number': parseInt(activeIssue.get())});
        thisProject = Projects.findOne({'name': activeProject.get()});
        workflow = thisProject.workflow;

        var result = false;
        if ((workflow[thisIssue.stateIndex].state != 'Open') &&
            (workflow[thisIssue.stateIndex].state != 'Closed')) {
            result = true;
        }

        return result;
    },
    users() {
        return Meteor.users.find({});
    }
});

Template.issuePage.events({
    'click [id=btn-add-comment]'(event, template) {
        Meteor.call('comments.insert', activeProject.get(), parseInt(activeIssue.get()), $('#txt-comment').val());
        $('#txt-comment').val('');
        $('#div-comment').removeClass('in');
    },
    'click [id=btn-next-state]'(event, template) {
        Meteor.call('issues.incrementState', activeProject.get(), parseInt(activeIssue.get()));
    },
    'click [name=comments-tab]'(event, template) {
        console.log(event.target.id);
        $('.tab-pane.in').removeClass('in');
        $('.tab-pane.active').removeClass('active');

        activePaneId = event.target.id.split('-')[1];
        console.log(activePaneId);
        $('#' + activePaneId).addClass('active');
        $('#' + activePaneId).addClass('in');
    }
});
