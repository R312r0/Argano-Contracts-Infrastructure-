pragma solidity ^0.4.11;

contract BallotClass {
    uint[] public ballots;
    uint public votingLowerLimit = 3;
    
    struct Ballot {
        address owner;
        address miningKey;
        address affectedKey;
        string memo;
        uint affectedKeyType;
        uint createdAt;
        uint votingStart;
        uint votingDeadline;
        int votesAmmount;
        int result;
        bool addAction;
        bool active;
        mapping (address => bool) voted;
    }
    
    mapping(uint => Ballot) public ballotsMapping;
}

contract KeyClass {
    struct InitialKey {
        bool isNew;
    }
   
    struct MiningKey {
        bool isActive;
    }
    
    struct PayoutKey {
        bool isActive;
    }

    struct VotingKey {
        bool isActive;
    }
    
    mapping(address => MiningKey) public miningKeys;
    mapping(address => PayoutKey) public payoutKeys;
    mapping(address => VotingKey) public votingKeys;
    mapping(address => InitialKey) public initialKeys;
    mapping(address => address) public votingMiningKeysPair;
    mapping(address => address) public miningPayoutKeysPair;
}

contract owned {
    address public owner;

    function owned() {
        owner = 0xDd0BB0e2a1594240fED0c2f2c17C1E9AB4F87126; //msg.sender
    }

    modifier onlyOwner {
        if (msg.sender != owner) throw;
        _;
    }
}

contract ValidatorClass {
    address[] public validators;
    address[] public disabledValidators;
    
    struct Validator {
        string fullName;
        string streetName;
        string state;
        uint zip;
        uint licenseID;
        uint licenseExpiredAt;
        uint disablingDate;
        string disablingTX;
    }
    
    mapping(address => Validator) public validator;
}













contract KeysManager is owned, KeyClass, ValidatorClass, BallotClass {
    int8 internal initialKeysIssued = 0;
    int8 internal initialKeysLimit = 12;
    int8 internal licensesIssued = 0;
    int8 internal licensesLimit = 52;
    
    /**
    @notice Adds initial key
    @param key Initial key
    */
    function addInitialKey(address key) onlyOwner {
        if (initialKeysIssued >= initialKeysLimit) throw;
        initialKeysIssued++;
        initialKeys[key] = InitialKey({isNew: true});
    }
    
    /**
    @notice Create production keys for notary
    @param miningAddr Mining key
    @param payoutAddr Payout key
    @param votingAddr Voting key
    */
    function createKeys(
        address miningAddr, 
        address payoutAddr, 
        address votingAddr
    ) {
        if (!checkInitialKey(msg.sender)) throw;
        //invalidate initial key
        delete initialKeys[msg.sender];
        miningKeys[miningAddr] = MiningKey({isActive: true});
        payoutKeys[payoutAddr] = PayoutKey({isActive: true});
        votingKeys[votingAddr] = VotingKey({isActive: true});
        //add mining key to list of validators
        licensesIssued++;
        validators.push(miningAddr);
        votingMiningKeysPair[votingAddr] = miningAddr;
        miningPayoutKeysPair[miningAddr] = payoutAddr;
    }
    
    /**
    @notice Checks, if initial key is new or not
    @param key Initial key
    @return { "value" : "Is initial key new or not new" }
    */
    function checkInitialKey(address key) constant returns (bool value) {
        if (msg.sender != key) throw;
        return initialKeys[key].isNew;
    }
    
    /**
    @notice Checks, if payout key is active or not
    @param addr Payout key
    @return { "value" : "Is payout key active or not active" }
    */
    function checkPayoutKeyValidity(address addr) constant returns (bool value) {
        //if (msg.sender != addr) throw;
        return payoutKeys[addr].isActive;
    }
    
    /**
    @notice Checks, if voting key is active or not
    @param addr Voting key
    @return { "value" : "Is voting key active or not active" }
    */
    function checkVotingKeyValidity(address addr) constant returns (bool value) {
        //if (msg.sender != addr) throw;
        return votingKeys[addr].isActive;
    }
}

contract ValidatorsManager is ValidatorClass, KeysManager {
    
    /**
    @notice Adds new notary
    @param miningKey Notary's mining key
    @param zip Notary's zip code
    @param licenseID Notary's license ID
    @param licenseExpiredAt Notary's expiration date
    @param fullName Notary's full name
    @param streetName Notary's address
    @param state Notary's US state full name
    */
    function addValidator(
        address miningKey,
        uint zip,
        uint licenseID,
        uint licenseExpiredAt,
        string fullName,
        string streetName,
        string state
    ) {
        if (!checkVotingKeyValidity(msg.sender) && !checkInitialKey(msg.sender)) throw;
        if (licensesIssued == licensesLimit) throw;
        validator[miningKey] = ValidatorClass.Validator({
            fullName: fullName, 
            streetName: streetName, 
            state: state, 
            zip: zip, 
            licenseID: licenseID, 
            licenseExpiredAt: licenseExpiredAt, 
            disablingDate: 0, 
            disablingTX: ""
        });
    }
    
    /**
    @notice Gets active notaries mining keys
    @return { "value" : "Array of active notaries mining keys" }
    */
    function getValidators() constant returns (address[] value) {
        return validators;
    }
    
    /**
    @notice Gets disabled notaries mining keys
    @return { "value" : "Array of disabled notaries mining keys" }
    */
    function getDisabledValidators() constant returns (address[] value) {
        return disabledValidators;
    }
    
    /**
    @notice Gets notary's full name
    @param addr Notary's mining key
    @return { "value" : "Notary's full name" }
    */
    function getValidatorFullName(address addr) constant returns (string value) {
        return validator[addr].fullName;
    }
    
    /**
    @notice Gets notary's address
    @param addr Notary's mining key
    @return { "value" : "Notary's address" }
    */
    function getValidatorStreetName(address addr) constant returns (string value) {
        return validator[addr].streetName;
    }
    
    /**
    @notice Gets notary's state full name
    @param addr Notary's mining key
    @return { "value" : "Notary's state full name" }
    */
    function getValidatorState(address addr) constant returns (string value) {
        return validator[addr].state;
    }
    
    /**
    @notice Gets notary's zip code
    @param addr Notary's mining key
    @return { "value" : "Notary's zip code" }
    */
    function getValidatorZip(address addr) constant returns (uint value) {
        return validator[addr].zip;
    }
    
    /**
    @notice Gets notary's license ID
    @param addr Notary's mining key
    @return { "value" : "Notary's license ID" }
    */
    function getValidatorLicenseID(address addr) constant returns (uint value) {
        return validator[addr].licenseID;
    }
    
    /**
    @notice Gets notary's license expiration date
    @param addr Notary's mining key
    @return { "value" : "Notary's license expiration date" }
    */
    function getValidatorLicenseExpiredAt(address addr) constant returns (uint value) {
        return validator[addr].licenseExpiredAt;
    }

    /**
    @notice Gets notary's disabling date
    @param addr Notary's mining key
    @return { "value" : "Notary's disabling date" }
    */
    function getValidatorDisablingDate(address addr) constant returns (uint value) {
        return validator[addr].disablingDate;
    }
}

contract BallotsManager is ValidatorsManager {
    /**
    @notice Adds new Ballot
    @param ballotID Ballot unique ID
    @param owner Voting key of notary, who creates ballot
    @param miningKey Mining key of notary, which is proposed to add or remove
    @param affectedKey Mining/payout/voting key of notary, which is proposed to add or remove
    @param affectedKeyType Type of affectedKey: 0 = mining key, 1 = voting key, 2 = payout key
    @param addAction Flag: adding is true, removing is false
    @param memo Ballot's memo
    */
    function addBallot(
        uint ballotID,
        address owner,
        address miningKey,
        address affectedKey,
        uint affectedKeyType,
        bool addAction,
        string memo
    ) {
        if (!checkVotingKeyValidity(msg.sender)) throw;
        if (licensesIssued == licensesLimit && addAction) throw;
        if (ballotsMapping[ballotID].createdAt > 0) throw;
        if (affectedKeyType == 0) {//mining key
            bool validatorIsAdded = false;
            for (uint i = 0; i < validators.length; i++) {
                if (validators[i] == affectedKey && addAction) throw; //validator is already added before
                if (validators[i] == affectedKey) {
                    validatorIsAdded = true;
                    break;
                }
            }
            for (uint j = 0; j < disabledValidators.length; j++) {
                if (disabledValidators[j] == affectedKey) throw; //validator is already removed before
            }
            if (!validatorIsAdded && !addAction) throw; // no such validator in validators array to remove it
        } else if (affectedKeyType == 1) {//voting key
            if (checkVotingKeyValidity(affectedKey) && addAction) throw; //voting key is already added before
            if (!checkVotingKeyValidity(affectedKey) && !addAction) throw; //no such voting key to remove it
        } else if (affectedKeyType == 2) {//payout key
            if (checkPayoutKeyValidity(affectedKey) && addAction) throw; //payout key is already added before
            if (!checkPayoutKeyValidity(affectedKey) && !addAction) throw; //no such payout key to remove it
        }
        uint votingStart = now;
        ballotsMapping[ballotID] = Ballot({
            owner: owner,
            miningKey: miningKey,
            affectedKey: affectedKey,
            memo: memo, 
            affectedKeyType: affectedKeyType,
            createdAt: now,
            votingStart: votingStart,
            votingDeadline: votingStart + 48 * 60 minutes,
            votesAmmount: 0,
            result: 0,
            addAction: addAction,
            active: true
        });
        ballots.push(ballotID);
        checkBallotsActivity();
    }
    
    /**
    @notice Gets active ballots' ids
    @return { "value" : "Array of active ballots ids" }
    */
    function getBallots() constant returns (uint[] value) {
        return ballots;
    }
    
    /**
    @notice Gets ballot's memo
    @param ballotID Ballot unique ID
    @return { "value" : "Ballot's memo" }
    */
    function getBallotMemo(uint ballotID) constant returns (string value) {
        return ballotsMapping[ballotID].memo;
    }
    
    /**
    @notice Gets ballot's action
    @param ballotID Ballot unique ID
    @return { "value" : "Ballot's action: adding is true, removing is false" }
    */
    function getBallotAction(uint ballotID) constant returns (bool value) {
        return ballotsMapping[ballotID].addAction;
    }
    
    /**
    @notice Gets mining key of notary
    @param ballotID Ballot unique ID
    @return { "value" : "Notary's mining key" }
    */
    function getBallotMiningKey(uint ballotID) constant returns (address value) {
        return ballotsMapping[ballotID].miningKey;
    }

    /**
    @notice Gets affected key of ballot
    @param ballotID Ballot unique ID
    @return { "value" : "Ballot's affected key" }
    */
    function getBallotAffectedKey(uint ballotID) constant returns (address value) {
        return ballotsMapping[ballotID].affectedKey;
    }

    /**
    @notice Gets affected key type of ballot
    @param ballotID Ballot unique ID
    @return { "value" : "Ballot's affected key type" }
    */
    function getBallotAffectedKeyType(uint ballotID) constant returns (uint value) {
        return ballotsMapping[ballotID].affectedKeyType;
    }

    function toString(address x) internal returns (string) {
        bytes memory b = new bytes(20);
        for (uint i = 0; i < 20; i++)
            b[i] = byte(uint8(uint(x) / (2**(8*(19 - i)))));
        return string(b);
    }

    /**
    @notice Gets ballot's owner full name
    @param ballotID Ballot unique ID
    @return { "value" : "Ballot's owner full name" }
    */
    function getBallotOwner(uint ballotID) constant returns (string value) {
        address ballotOwnerVotingKey = ballotsMapping[ballotID].owner;
        address ballotOwnerMiningKey = votingMiningKeysPair[ballotOwnerVotingKey];
        string validatorFullName = validator[ballotOwnerMiningKey].fullName;
        bytes memory ownerName = bytes(validatorFullName);
        if (ownerName.length == 0)
            return toString(ballotOwnerMiningKey);
        else
            return validatorFullName;
    }
    
    /**
    @notice Gets ballot's creation time
    @param ballotID Ballot unique ID
    @return { "value" : "Ballot's creation time" }
    */
    function ballotCreatedAt(uint ballotID) constant returns (uint value) {
        return ballotsMapping[ballotID].createdAt;
    }
    
    /**
    @notice Gets ballot's voting start date
    @param ballotID Ballot unique ID
    @return { "value" : "Ballot's voting start date" }
    */
    function getBallotVotingStart(uint ballotID) constant returns (uint value) {
        return ballotsMapping[ballotID].votingStart;
    }
    
    /**
    @notice Gets ballot's voting end date
    @param ballotID Ballot unique ID
    @return { "value" : "Ballot's voting end date" }
    */
    function getBallotVotingEnd(uint ballotID) constant returns (uint value) {
        return ballotsMapping[ballotID].votingDeadline;
    }
    
    /**
    @notice Gets ballot's amount of votes for
    @param ballotID Ballot unique ID
    @return { "value" : "Ballot's amount of votes for" }
    */
    function getVotesFor(uint ballotID) constant returns (int value) {
        return (ballotsMapping[ballotID].votesAmmount + ballotsMapping[ballotID].result)/2;
    }
    
    /**
    @notice Gets ballot's amount of votes against
    @param ballotID Ballot unique ID
    @return { "value" : "Ballot's amount of votes against" }
    */
    function getVotesAgainst(uint ballotID) constant returns (int value) {
        return (ballotsMapping[ballotID].votesAmmount - ballotsMapping[ballotID].result)/2;
    }
    
    /**
    @notice Checks, if ballot is active
    @param ballotID Ballot unique ID
    @return { "value" : "Ballot's activity: active or not" }
    */
    function ballotIsActive(uint ballotID) constant returns (bool value) {
        return ballotsMapping[ballotID].active;
    }

    /**
    @notice Checks, if ballot is already voted by signer of current transaction
    @param ballotID Ballot unique ID
    @return { "value" : "Ballot is already voted by signer of current transaction: yes or no" }
    */
    function ballotIsVoted(uint ballotID) constant returns (bool value) {
        return ballotsMapping[ballotID].voted[msg.sender];
    }
    
    /**
    @notice Votes
    @param ballotID Ballot unique ID
    @param accept Vote for is true, vote against is false
    */
    function vote(uint ballotID, bool accept) {
        if (!checkVotingKeyValidity(msg.sender)) throw;
        Ballot v =  ballotsMapping[ballotID];
        if (v.votingDeadline < now) throw;
        if (v.voted[msg.sender] == true) throw;
        v.voted[msg.sender] = true;
        v.votesAmmount++;
        if (accept) v.result++;
        else v.result--;
        checkBallotsActivity();
    }

    /**
    @notice Removes element by index from validators array and shift elements in array
    @param index Element's index to remove
    @return { "value" : "Updated validators array with removed element at index" }
    */
    function removeValidator(uint index) internal returns(address[]) {
        if (index >= validators.length) return;

        for (uint i = index; i<validators.length-1; i++){
            validators[i] = validators[i+1];
        }
        delete validators[validators.length-1];
        validators.length--;
    }
    
    /**
    @notice Checks ballots' activity
    @dev Deactivate ballots, if ballot's time is finished and implement action: add or remove notary, if votes for are greater votes against, and total votes are greater than 3
    */
    function checkBallotsActivity() internal {
        for (uint ijk = 0; ijk < ballots.length; ijk++) {
            Ballot b = ballotsMapping[ballots[ijk]];
            if (b.votingDeadline < now && b.active) {
                if ((int(b.votesAmmount) >= int(votingLowerLimit)) && b.result > 0) {
                    if (b.addAction) { //add key
                        if (b.affectedKeyType == 0) {//mining key
                            if (licensesIssued < licensesLimit) {
                                licensesIssued++;
                                validators.push(b.affectedKey);
                            }
                        } else if (b.affectedKeyType == 1) {//voting key
                            votingKeys[b.affectedKey] = VotingKey({isActive: true});
                            votingMiningKeysPair[b.affectedKey] = b.miningKey;
                        } else if (b.affectedKeyType == 2) {//payout key
                            payoutKeys[b.affectedKey] = PayoutKey({isActive: true});
                            miningPayoutKeysPair[b.miningKey] = b.affectedKey;
                        }
                    } else { //invalidate key
                        if (b.affectedKeyType == 0) {//mining key
                            for (uint jj = 0; jj < validators.length; jj++) {
                                if (validators[jj] == b.affectedKey) {
                                    removeValidator(jj); 
                                    return;
                                }
                            }
                            disabledValidators.push(b.affectedKey);
                            validator[b.affectedKey].disablingDate = now;
                        } else if (b.affectedKeyType == 1) {//voting key
                            votingKeys[b.affectedKey] = VotingKey({isActive: false});
                        } else if (b.affectedKeyType == 2) {//payout key
                            payoutKeys[b.affectedKey] = PayoutKey({isActive: false});
                        }
                    }
                }
                b.active = false;
            }
        }
    }
}

/**
@title Oracles Interface
@author Oracles
*/
contract Oracles is BallotsManager {
	function Oracles() {
		validators.push(owner);
	}
}


