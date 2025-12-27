# Specify the base Docker image. You can read more about
# the available images at https://crawlee.dev/docs/guides/docker-images
# You can also use any other image from Docker Hub.
FROM apify/actor-node-playwright-chrome:20

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY package*.json ./

# Install NPM packages, skip optional and development dependencies to
# keep the image small.
RUN npm --quiet set progress=false \
    && npm ci --omit=dev --omit=optional \
    && echo "Installed NPM packages" \
    && npx playwright install chromium

# Copy the rest of the source code to the image.
COPY . ./

# Run the image.
CMD [ "npm", "start" ]
