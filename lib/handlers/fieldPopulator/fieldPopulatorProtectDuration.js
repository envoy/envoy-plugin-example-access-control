function fieldPopulatorProtectDurations(req, res) {
  res.send(
    [
      { label: '30 Minutes', value: '30' },
      { label: '1 Hour', value: '60' },
      { label: '1.5 Hours', value: '90' },
      { label: '2 Hours', value: '120' },
      { label: '2.5 Hours', value: '150' },
      { label: '3 Hours', value: '180' },
      { label: '3.5 Hours', value: '210' },
      { label: '4 Hours', value: '240' },
      { label: '4.5 Hour', value: '270' },
      { label: '5 Hours', value: '300' },
      { label: '5.5 Hours', value: '330' },
      { label: '6 Hours', value: '360' },
      { label: '6.5 Hours', value: '390' },
      { label: '7 Hours', value: '420' },
      { label: '7.5 Hours', value: '450' },
      { label: '8 Hours', value: '480' },
      { label: '8.5 Hours', value: '510' },
      { label: '9 Hours', value: '540' },
      { label: '9.5 Hours', value: '570' },
      { label: '10 Hours', value: '600' },
      { label: '10.5 Hours', value: '630' },
      { label: '11 Hours', value: '660' },
      { label: '11.5 Hours', value: '690' },
      { label: '12 Hours', value: '720' },
    ],
  );
}

module.exports = fieldPopulatorProtectDurations;
