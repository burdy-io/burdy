import * as yup from 'yup';

const Validators = {
  firstName: () => yup.string().min(2).required().label('First name'),
  lastName: () => yup.string().min(2).required().label('Last name'),
  email: () => yup.string().email().required().label('Email'),
  password: () => yup.string().min(6).required().label('Password'),
  imageSize: () => yup.object().shape({
    key: yup.string().required().min(2).label('Key'),
    width: yup.number().when('height', {
      is: (height) => !height || height.length === 0,
      then: yup.number().integer().required(),
      otherwise: yup.number().integer()
    }).label('Width'),
    height: yup.number().when('width', {
      is: (width) => !width || width.length === 0,
      then: yup.number().integer().required(),
      otherwise: yup.number().integer()
    }).label('Height'),
    quality: yup.number().integer().min(10).max(100).required().label('Quality'),
    resize: yup.string().oneOf(['cover', 'contain', 'fill', 'inside', 'outside']).label('Resize'),
  }, ['width', 'height'] as any)
};

export const slugRegex = /^[a-z0-9]+(?:(-|_)[a-z0-9]+)*$/;
export const slugRegexMessage = 'invalid_pattern';

export default Validators;
