import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Projects } from './projects';

export const Issues = new Mongo.Collection('issues');

if (Meteor.isServer) {
    Meteor.methods({
        'issues.insert'(project, title, description, tracker, priority, severity, dueDate, responsible) {
            check(project, String);
            check(title, String);
            check(description, String);
            check(tracker, String);
            check(priority, String);
            check(severity, String);
            check(dueDate, String)
            check(responsible, String);

            var thisProject = Projects.findOne({'name': project});

            if (Meteor.user().profile.isRoot
                || thisProject.noIssueFilingRestrictions
                || (Meteor.user().username == thisProject.admin)
                || (thisProject.pmUsers.indexOf(Meteor.user().username) >= 0)) {

                var workflow = thisProject.workflow;
                var participants = [];

                for (var i  = 0; i < workflow.length; i++) {
                    participants.push([]);

                    if ((i >= 1) || (i < (workflow.length - 1))) {
                        participants[i].push(responsible);
                    }
                }

                var history = [];
                history.push({
                        type: '$issueCreated',
                        date: moment(new Date()).format('YYYY-MM-DD, HH:mm'),
                        actor: Meteor.user().username,
                        assignee: responsible});

                Issues.insert({
                    number: Issues.find({}).count() + 1,
                    project: project,
                    title: title,
                    description: description,
                    tracker: tracker,
                    priority: priority,
                    severity: severity,
                    createdBy: Meteor.user().username,
                    responsible: responsible,
                    stateIndex: 0,
                    stateStr: workflow[0].stateName,
                    isClosed: false,
                    workflow: workflow,
                    createdAt: moment(new Date()).format("YYYY-MM-DD HH:mm"),
                    dueDate: dueDate,
                    history: history,
                    participants: participants,
                    customFields: thisProject.customFields,
                });
            }
        },
        'issues.update'(project, issue, title, description, tracker, priority, severity, dueDate, responsible) {
            check(project, String);
            check(issue, Number);
            check(title, String);
            check(description, String);
            check(tracker, String);
            check(priority, String);
            check(severity, String);
            check(dueDate, String)
            check(responsible, String);

            var thisProject = Projects.findOne({'name': project});
            var thisIssue = Issues.findOne({'project': project, 'number': issue});

            thisIssue.history.push({
                type: '$updateIssue',
                date: moment(new Date()).format('YYYY-MM-DD, HH:mm'),
                actor: Meteor.user().username,
            });

            Issues.update({
                number: issue,
                project: project
            }, {$set: {
                    title: title,
                    description: description,
                    tracker: tracker,
                    priority: priority,
                    severity: severity,
                    responsible: responsible,
                    dueDate: dueDate,
                    history: thisIssue.history,
                }
            });
        },
        'issues.incrementState'(project, issueNumber, stateChangeMsg) {
            check(project, String);
            check(issueNumber, Number);

            var thisIssue = Issues.findOne({'project': project, 'number': issueNumber});
            var thisProject = Projects.findOne({'name': project});

            if (thisIssue.responsible == Meteor.user().username) {
                if (thisIssue.stateIndex < (thisProject.workflow.length - 1)) {
                    var startState = thisIssue.workflow[thisIssue.stateIndex].stateName;
                    thisIssue.stateIndex += 1;
                    var endState = thisIssue.workflow[thisIssue.stateIndex].stateName;

                    thisIssue.isClosed = (thisIssue.stateIndex == thisIssue.workflow.length - 1);

                    thisIssue.history.push({
                        type: '$changeState',
                        date: moment(new Date()).format('YYYY-MM-DD, HH:mm'),
                        actor: Meteor.user().username,
                        startState: startState,
                        endState: endState,
                        msg: stateChangeMsg,
                    });

                    Issues.update({
                        'project': project, 'number': issueNumber
                    }, {
                        $set: {
                            'stateIndex': thisIssue.stateIndex,
                            'isClosed': thisIssue.isClosed,
                            'stateStr': thisIssue.workflow[thisIssue.stateIndex].stateName,
                            'history': thisIssue.history,
                        }
                    });
                }
            } else {
                throw new Meteor.Error('not-authorized');
            }
        },
        'issues.setState'(project, issueNumber, state, stateChangeMsg, subStateMsg) {
            check(project, String);
            check(issueNumber, Number);
            check(state, Number);

            var thisIssue = Issues.findOne({'project': project, 'number': issueNumber});
            var thisProject = Projects.findOne({'name': project});

            if (thisIssue.responsible == Meteor.user().username) {
                var startState = thisIssue.workflow[thisIssue.stateIndex].stateName;
                thisIssue.stateIndex = state;
                var endState = thisIssue.workflow[thisIssue.stateIndex].stateName;

                thisIssue.isClosed = (thisIssue.stateIndex == thisIssue.workflow.length - 1);

                thisIssue.history.push({
                    type: '$changeState',
                    date: moment(new Date()).format('YYYY-MM-DD, HH:mm'),
                    actor: Meteor.user().username,
                    startState: startState,
                    endState: endState,
                    msg: stateChangeMsg,
                });

                Issues.update({
                    'project': project, 'number': issueNumber
                }, {
                    $set: {
                        'stateIndex': thisIssue.stateIndex,
                        'isClosed': thisIssue.isClosed,
                        'stateStr': thisIssue.workflow[thisIssue.stateIndex].stateName,
                        'history': thisIssue.history,
                    }
                });

                if(subStateMsg) {
                    check(subStateMsg, String);
                    Issues.update({'project': project, 'number': issueNumber}, {$set: {'subStateMsg': subStateMsg}});
                }
            } else {
                throw new Meteor.Error('not-authorized');
            }
        },
        'issues.addParticipant'(project, issueNumber, state, participant) {
            check(project, String);
            check(issueNumber, Number);
            check(state, Number);
            check(participant, String);

            var participantFound = true;
            var thisIssue = Issues.findOne({'project': project, 'number': issueNumber});

            var participants = thisIssue.participants;
            if(participants[state].indexOf(participant) < 0) {
                participants[state].push(participant);
                participantFound = false;
            }

            if (!participantFound) {
                var history = thisIssue.history;
                history.push({
                    type: '$addParticipant',
                    date: moment(new Date()).format('YYYY-MM-DD, HH:mm'),
                    actor: Meteor.user().username,
                    participant: participant,
                    participantsRole: thisIssue.workflow[thisIssue.stateIndex].participantsRole
                });

                Issues.update({'project': project, 'number': issueNumber}, {$set: {'participants': participants, 'history': history}});
            }

            return (!participantFound);
        },
    });
}
