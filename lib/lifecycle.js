// Contract Lifecycle State Machine
// States: created, approved, sent, signed, locked, revoked

export const CONTRACT_STATES = {
  CREATED: 'created',
  APPROVED: 'approved',
  SENT: 'sent',
  SIGNED: 'signed',
  LOCKED: 'locked',
  REVOKED: 'revoked'
};

// Define valid transitions
const VALID_TRANSITIONS = {
  [CONTRACT_STATES.CREATED]: [CONTRACT_STATES.APPROVED, CONTRACT_STATES.REVOKED],
  [CONTRACT_STATES.APPROVED]: [CONTRACT_STATES.SENT, CONTRACT_STATES.REVOKED],
  [CONTRACT_STATES.SENT]: [CONTRACT_STATES.SIGNED, CONTRACT_STATES.REVOKED],
  [CONTRACT_STATES.SIGNED]: [CONTRACT_STATES.LOCKED],
  [CONTRACT_STATES.LOCKED]: [], // Terminal state - no transitions
  [CONTRACT_STATES.REVOKED]: [] // Terminal state - no transitions
};

// Check if a transition is valid
export function isValidTransition(currentState, newState) {
  const validNextStates = VALID_TRANSITIONS[currentState] || [];
  return validNextStates.includes(newState);
}

// Get valid next states for a given state
export function getValidNextStates(currentState) {
  return VALID_TRANSITIONS[currentState] || [];
}

// Check if contract is immutable (locked or revoked)
export function isImmutable(state) {
  return state === CONTRACT_STATES.LOCKED || state === CONTRACT_STATES.REVOKED;
}

// Get status display info
export function getStatusInfo(status) {
  const statusMap = {
    [CONTRACT_STATES.CREATED]: { label: 'Created', color: 'bg-blue-100 text-blue-800', category: 'pending' },
    [CONTRACT_STATES.APPROVED]: { label: 'Approved', color: 'bg-yellow-100 text-yellow-800', category: 'pending' },
    [CONTRACT_STATES.SENT]: { label: 'Sent', color: 'bg-purple-100 text-purple-800', category: 'active' },
    [CONTRACT_STATES.SIGNED]: { label: 'Signed', color: 'bg-green-100 text-green-800', category: 'signed' },
    [CONTRACT_STATES.LOCKED]: { label: 'Locked', color: 'bg-gray-100 text-gray-800', category: 'signed' },
    [CONTRACT_STATES.REVOKED]: { label: 'Revoked', color: 'bg-red-100 text-red-800', category: 'revoked' }
  };
  return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', category: 'unknown' };
}

// Get action button info for transitions
export function getTransitionActions(currentState) {
  const actionMap = {
    [CONTRACT_STATES.APPROVED]: { label: 'Approve', icon: 'CheckCircle', variant: 'default' },
    [CONTRACT_STATES.SENT]: { label: 'Send', icon: 'Send', variant: 'default' },
    [CONTRACT_STATES.SIGNED]: { label: 'Mark Signed', icon: 'PenTool', variant: 'default' },
    [CONTRACT_STATES.LOCKED]: { label: 'Lock', icon: 'Lock', variant: 'secondary' },
    [CONTRACT_STATES.REVOKED]: { label: 'Revoke', icon: 'XCircle', variant: 'destructive' }
  };
  
  const validStates = getValidNextStates(currentState);
  return validStates.map(state => ({
    targetState: state,
    ...actionMap[state]
  }));
}
