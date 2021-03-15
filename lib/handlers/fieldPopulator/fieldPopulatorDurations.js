function fieldPopulatorDurations(req, res) {
  res.send(
    [ 
      { label: '5 Minutes', value: '5' },
      { label: '10 Minutes', value: '10' },
      { label: '15 Minutes', value: '15' },
      { label: '30 Minutes', value: '30' },
      { label: '45 Minutes', value: '45' },
      { label: '1 Hour', value: '60' },
      { label: '1.5 Hours', value: '90' },
      { label: '2 Hours', value: '120' },
      { label: '4 Hours', value: '240' },
      { label: '8 Hours', value: '480' },
      { label: '12 Hours', value: '720' },
      { label: '24 Hours', value: '1440' },
    ],
  );
}

module.exports = fieldPopulatorDurations;
