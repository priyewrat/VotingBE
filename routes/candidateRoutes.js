const express = require('express');
const router = express.Router();
const User = require('../modules/user');
const {jwtAuthMiddleware} = require('../jwt');
const Candidate = require('../modules/candidate');

const checkAdminRole = async (userID) => {
  try {
    const user = await User.findById(userID);
    if(user.role === 'admin'){
      return true
    }  
  } catch (err) {
    return false;
  }
}

//POST route to add a candidate
router.post('/', jwtAuthMiddleware, async (req, res)=>{
 try {

  if(!(await checkAdminRole(req.user.id)))
      return res.status(403).json({message: 'user does not have admin role'});
    
    const data = req.body; // Assuming the request body contains the candidate data
    
    //Create a new User document using the Mongoose model
    const newCandidate = new Candidate(data);

    //Save the new User to the database
    const response = await newCandidate.save();
    console.log('data saved');
    res.status(200).json({response: response});     
  }catch (err) {
    console.log(err);
    res.status(500).json({error: 'Internal Server Error'});
  }
});

router.put('/:candidateID', jwtAuthMiddleware, async(req, res)=>{
  try {

    if(!checkAdminRole(req.user.id))
      return res.status(403).json({message: 'user does not have admin role'});

    const candidateID = req.params.candidateID;
    const updatedCandidateData = req.body;

    const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
      new: true, //Returns the updated document
      runValidators: true, // Rum Mongoose validation
    });

    if(!response){
      return res.status(404).json({error: "Candidate not found" });
    }

    console.log('candidate data updated');
    res.status(200).json(response);
  } catch (err) {
    console.log(err);
    res.status(500).json({error: 'Internal Server Error'});
  }
});

router.delete('/:candidateID', jwtAuthMiddleware, async(req, res)=>{
  try {

    if(!checkAdminRole(req.user.id))
      return res.status(403).json({message: 'user does not have admin role'});

    const candidateID = req.params.candidateID;

    const response = await Candidate.findByIdAndDelete(candidateID);

    if(!response){
      return res.status(404).json({error: "Candidate not found" });
    }

    console.log('candidate deleted');
    res.status(200).json({message: 'candidate Deleted Successfully'});
  } catch (err) {
    console.log(err);
    res.status(500).json({error: 'Internal Server Error'});
  }
});


//let's start voting
router.post('/vote/:candidateID', jwtAuthMiddleware, async (req, res)=>{
  //no admin can vote
  // user can only vote once

  const candidateID = req.params.candidateID;
  const userID = req.user.id;

  try {
    //Find the Candiadte document with the specified candidateID
    const candidate = await Candidate.findById(candidateID);
    if(!candidate){
    return res.status(404).json({message: 'Candidate not found'});
  }

  const user = await User.findById(userID);
  if(!user){
    return res.status(404).json({message: 'user not found'});
  }
  if(user.isVoted){
   return res.status(400).json({message: "You have already voted"});
  }
  if(user.role === 'admin'){
    return res.status(403).json({message: 'admin is not allowed'});
  }

  //Update the Candidate document to record the vote
  candidate.votes.push({user: userID})
  candidate.voteCount++;
  await candidate.save();

  //update the user document
  user.isVoted = true
  await user.save();

  res.status(200).json({message: "Vote recorded successfully"});
  } catch (err) {
    console.log(err);
    res.status(500).json({error: 'Internal Server Error'});
  }
});

//vote count
router.get('/vote/count', async (req, res)=>{
  try {
    //Find all candidates and sort them by voteCount in descending order
    const candidate = await Candidate.find().sort({voteCount: 'desc'});
 
    //Map the candidates to only retrun their name and voteCount
    const voteRecord = candidate.map((data)=>{
      return{
        party: data.party,
        count: data.voteCount
      }
    });

    return res.status(200).json(voteRecord);
  } catch (err) {
    console.log(err);
    res.status(500).json({error: 'Internal Server Error'});
  }
});

router.get('/candidate', async(req, res)=>{
  try {
    // list of candidate
    const candidate = await Candidate.find();
    const allCandidateData = candidate.map((data)=>{
      return{
        name: data.name,
        party: data.party,
        age: data.age
      }
    });

    return res.status(200).json(allCandidateData);
  } catch (error) {
    console.log(err);
    res.status(500).json({error: 'Internal Server Error'});
  }
});


module.exports = router;